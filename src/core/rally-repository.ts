import { RelationshipLoader } from './relationship-loader.js';
import { getEntityTypeFromRef, isRallyRef, normalizeEntityType, toRelativeRef } from './ref-utils.js';
import type { RallyClient, IQueryOptions } from './rally-client.js';
import type { RallyDataSource } from './rally-datasource.js';
import { RallyEntity } from '../models/base-entity.js';
import type { RallyModelClass } from '../models/registry.js';
import { RallyValidationError, RallyOperationError } from './errors.js';

/**
 * Repository-level query options.
 *
 * `select` is the unified field list for both scalar pre-fetching
 * and relation eager-loading. Dot-notation (`'Owner.Email'`) automatically
 * adds the base field to the WSAPI fetch and schedules the nested path
 * for eager loading. Type filter syntax (`'WorkProducts[HierarchicalRequirement].TestCases'`)
 * restricts nested eager loading to a specific entity sub-type.
 */
export interface IFindOptions extends Omit<IQueryOptions, 'fetch'> {
    select?: string | string[];
    where?: Record<string, unknown>;
}

interface IIncludeNode {
    children: Record<string, IIncludeNode>;
}

interface ITagRef {
    _ref: string;
}

interface IRallyTagData {
    _ref?: string;
    Name?: string;
    ObjectID?: string | number;
}

// ---------------------------------------------------------------------------
// Phase 5 – TypeScript inference helpers
// ---------------------------------------------------------------------------

/**
 * Extract the top-level field name from a select path.
 *
 * Handles all three path forms:
 *   - `'WorkProducts[HR].TestCases'` → `'WorkProducts'`
 *   - `'WorkProducts[HR]'`           → `'WorkProducts'`
 *   - `'Owner.Email'`                → `'Owner'`
 *   - `'Name'`                       → `'Name'`
 */
type TopLevelField<S extends string> =
    S extends `${infer F}[${string}].${string}` ? F :
    S extends `${infer F}[${string}]` ? F :
    S extends `${infer F}.${string}` ? F : S;

/**
 * Given a model type `T` and a `readonly` select list `S`, returns a type
 * where the selected top-level fields are required and all others are optional.
 *
 * Requires `as const` at the call site so TypeScript infers string literals.
 *
 * @example
 * const r = await repo.findOneBy({ select: ['Name', 'ObjectID'] as const });
 * r.Name      // string (required)
 * r.Owner     // SomeType | undefined (optional — not in select)
 */
export type SelectResult<T, S extends readonly string[]> =
    Pick<T, Extract<TopLevelField<S[number]>, keyof T>> &
    Partial<Omit<T, Extract<TopLevelField<S[number]>, keyof T>>>;

/** Version of `IFindOptions` that binds the select list to a typed tuple. */
export type IFindOptionsWithSelect<TSelect extends readonly string[]> =
    Omit<IFindOptions, 'select'> & { select: TSelect };

/**
 * Repository abstraction for a single Rally entity type.
 *
 * Repositories provide typed CRUD operations, query helpers, entity wrapping,
 * and optional relationship eager loading on top of the lower-level
 * {@link RallyClient}.
 */
export class RallyRepository<T extends RallyEntity = any> {
    entityType: string;
    client: RallyClient;
    modelClass: typeof RallyEntity | null;
    modelRegistry: Record<string, RallyModelClass>;
    dataSource: RallyDataSource | null;
    relationshipLoader: RelationshipLoader;

    /**
     * Create a repository for one Rally entity type.
     *
     * @param entityType Rally entity type handled by this repository.
     * @param rallyClient Client used for all WSAPI requests.
     * @param modelClass Optional model class used to wrap raw Rally records.
     * @param modelRegistry Model registry used for relation resolution.
     * @param dataSource Owning datasource when the repository is created by {@link RallyDataSource}.
     * @throws RallyValidationError When `entityType` or `rallyClient` are invalid.
     */
    constructor(
        entityType: string,
        rallyClient: RallyClient,
        modelClass: typeof RallyEntity | null = null,
        modelRegistry: Record<string, RallyModelClass> = {},
        dataSource: RallyDataSource | null = null
    ) {
        if (!entityType || typeof entityType !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
        }
        if (!rallyClient || typeof rallyClient.query !== 'function') {
            throw new RallyValidationError('Rally client is required and must be a valid RallyClient instance');
        }

        this.entityType = entityType;
        this.client = rallyClient;
        this.modelClass = modelClass;
        this.modelRegistry = modelRegistry;
        this.dataSource = dataSource;
        this.relationshipLoader = new RelationshipLoader(
            rallyClient,
            typeof rallyClient.getRelationshipLoaderOptions === 'function'
                ? rallyClient.getRelationshipLoaderOptions()
                : {}
        );
    }

    /**
     * Find entities using direct query options.
     *
     * @param options Query, fetch, pagination, and relationship include options.
     * @returns Matching entities wrapped in the configured model class.
     */
    find<S extends readonly string[]>(options: IFindOptionsWithSelect<S>): Promise<Array<SelectResult<T, S>>>;
    find(options?: IFindOptions): Promise<T[]>;
    async find(options: IFindOptions = {}): Promise<T[]> {
        const normalized = this._normalizeOptions(options);
        const { include, ...queryOptions } = normalized;

        let entities = await this.client.query<any>(this.entityType, queryOptions);

        entities = this._wrapEntities(entities);

        if (include && include.length > 0) {
            entities = await this.relationshipLoader.loadRelationships(
                entities,
                include,
                this.modelRegistry
            );

            this._hydrateIncludedRelationships(entities, include);
        }

        return entities;
    }

    /**
     * Find entities matching an object-based `where` clause.
     *
     * @param options Repository query options including `where` filters and optional includes.
     * @returns Matching entities wrapped in the configured model class.
     */
    findBy<S extends readonly string[]>(options: IFindOptionsWithSelect<S> & { where?: Record<string, unknown> }): Promise<Array<SelectResult<T, S>>>;
    findBy(options?: IFindOptions): Promise<T[]>;
    async findBy(options: IFindOptions = {}): Promise<T[]> {
        const { where = {}, ...otherOptions } = options;

        this._warnNonFilterableFields(where);
        const query = this._buildQuery(where);
        const normalized = this._normalizeOptions(otherOptions);
        const { include, ...queryOptions } = normalized;

        this.client.logger?.debug(`[${this.entityType}] Query: ${query}`);

        let entities = await this.client.query<any>(this.entityType, {
            query,
            ...queryOptions
        });

        entities = this._wrapEntities(entities);

        if (include && include.length > 0) {
            entities = await this.relationshipLoader.loadRelationships(
                entities,
                include,
                this.modelRegistry
            );

            this._hydrateIncludedRelationships(entities, include);
        }

        return entities;
    }

    /**
     * Find all entities matching a filter, traversing every result page.
     *
     * @param options Repository query options including `where`, ordering, and includes.
     * @returns Every matching entity up to the optional `maxResults` limit.
     */
    findAllBy<S extends readonly string[]>(options: IFindOptionsWithSelect<S> & { where?: Record<string, unknown> }): Promise<Array<SelectResult<T, S>>>;
    findAllBy(options?: IFindOptions): Promise<T[]>;
    async findAllBy(options: IFindOptions = {}): Promise<T[]> {
        const { where = {}, ...otherOptions } = options;

        this._warnNonFilterableFields(where);
        const query = this._buildQuery(where);
        const normalized = this._normalizeOptions(otherOptions);
        const { include, ...queryOptions } = normalized;

        this.client.logger?.debug(`[${this.entityType}] QueryAll: ${query}`);

        let entities = await this.client.queryAll<any>(this.entityType, {
            query,
            ...queryOptions
        });

        entities = this._wrapEntities(entities);

        if (include && include.length > 0) {
            entities = await this.relationshipLoader.loadRelationships(
                entities,
                include,
                this.modelRegistry
            );

            this._hydrateIncludedRelationships(entities, include);
        }

        return entities;
    }

    /**
     * Find a single entity by ObjectID or by filter criteria.
     *
     * @param idOrWhere Either a Rally ObjectID or a `where` object.
     * @param options Additional query options used when resolving the entity.
     * @returns The matching entity, or `null` when no record is found.
     */
    async findOne(idOrWhere: string | number | Record<string, unknown>, options: IFindOptions = {}): Promise<T | null> {
        let entity: T | null;

        if (typeof idOrWhere === 'string' || typeof idOrWhere === 'number') {
            const normalized = this._normalizeOptions(options);
            const { include, ...queryOptions } = normalized;

            entity = await this.client.get<T>(this.entityType, String(idOrWhere), queryOptions) as T | null;

            if (!entity) {
                return null;
            }

            entity = this._wrapEntity(entity);

            if (include && include.length > 0) {
                entity = await this.relationshipLoader.loadRelationships(
                    entity as T & Record<string, unknown>,
                    include,
                    this.modelRegistry
                ) as T;

                this._hydrateIncludedRelationships(entity, include);
            }

            return entity;
        } else {
            const where = idOrWhere;
            return this.findOneBy({ where, ...options });
        }
    }

    /**
     * Find the first entity matching the provided criteria.
     *
     * @param options Repository query options with a `where` clause.
     * @returns The first matching entity, or `null` when no record is found.
     */
    findOneBy<S extends readonly string[]>(options: IFindOptionsWithSelect<S> & { where?: Record<string, unknown> }): Promise<SelectResult<T, S> | null>;
    findOneBy(options?: IFindOptions): Promise<T | null>;
    async findOneBy(options: IFindOptions = {}): Promise<T | null> {
        const results = await this.findBy({ ...options, pagesize: 1, start: 1 });
        return results[0] ?? null;
    }

    /**
     * Create a new entity.
     *
        * @param entityData Raw field payload to send to Rally.
        * @returns The created entity wrapped in the configured model class.
        * @throws RallyValidationError When `entityData` is missing or invalid.
        * @throws RallyOperationError When Rally rejects the create request.
     * @remarks **Tags non-atomicity**: if `entityData` contains a `Tags` array with string names,
     * each tag is resolved or created individually before the create request is sent.
     * This operation is **not atomic**: if one tag creation fails after others have already been
     * created in Rally, those previously created tags remain and are not rolled back.
     */
    async create(entityData: any): Promise<T> {
        if (!entityData || typeof entityData !== 'object') {
            throw new RallyValidationError('Entity data is required and must be an object');
        }

        const cleanData = await this._prepareSaveData(entityData);

        const result = await this.client.create(this.entityType, cleanData);
        return this._wrapEntity(result);
    }

    /**
     * Update an existing entity.
     *
     * @param objectId Rally ObjectID of the entity to update.
     * @param updateData Partial update payload or a dirty-trackable entity instance.
     * @returns The updated entity, or the original entity when no changes need to be sent.
     * @throws RallyValidationError When required inputs are missing or invalid.
     * @throws RallyOperationError When Rally rejects the update request.
     */
    async update(objectId: string | number | undefined, updateData: any): Promise<T> {
        if (!objectId) {
            throw new RallyValidationError('ObjectID is required');
        }
        if (!updateData || typeof updateData !== 'object') {
            throw new RallyValidationError('Update data is required and must be an object');
        }

        let dataToUpdate = updateData;
        const sourceEntity = this._isDirtyTrackableEntity(updateData) ? updateData : null;

        if (sourceEntity) {
            const changes = updateData.getChanges();
            if (Object.keys(changes).length === 0) {
                return updateData;
            }
            dataToUpdate = changes;
        }

        const cleanData = await this._prepareSaveData(dataToUpdate);

        if (Object.keys(cleanData).length === 0) {
            if (sourceEntity) {
                return sourceEntity as T;
            }

            return this._wrapEntity({ ObjectID: objectId, ...dataToUpdate });
        }

        const result = await this.client.update(this.entityType, objectId, cleanData);

        if (sourceEntity) {
            sourceEntity.commit();
        }

        return this._wrapEntity(result);
    }

    /**
     * Save an entity (create if new, update if exists).
     *
        * @param entity Entity instance or plain object to persist.
        * @returns The created or updated entity.
        * @throws RallyValidationError When `entity` is missing or invalid.
        * @throws RallyOperationError When Rally rejects the write request.
     * @remarks **Tags non-atomicity**: if the entity contains a `Tags` array with string names,
     * each tag is resolved or created individually before the write request is sent.
     * This operation is **not atomic**: if one tag creation fails after others have already been
     * created in Rally, those previously created tags remain and are not rolled back.
     */
    async save(entity: any): Promise<T> {
        if (!entity || typeof entity !== 'object') {
            throw new RallyValidationError('Entity is required and must be an object');
        }

        const raw = (typeof entity.toJSON === 'function')
            ? entity.toJSON()
            : (entity._data && typeof entity._data === 'object')
                ? { ...entity._data }
                : entity;

        const objectId = raw.ObjectID || raw.id;
        if (objectId) {
            return this.update(objectId, entity);
        } else {
            return this.create(raw);
        }
    }

    /**
     * Delete an entity by ObjectID.
     *
     * @param objectId Rally ObjectID of the entity to remove.
     * @returns `true` when the delete operation succeeds.
     * @throws RallyValidationError When `objectId` is missing.
     * @throws RallyOperationError When Rally rejects the delete request.
     */
    async delete(objectId: string | number): Promise<boolean> {
        if (!objectId) {
            throw new RallyValidationError('ObjectID is required');
        }

        await this.client.delete(this.entityType, objectId);
        return true;
    }

    /**
     * Remove an entity by identifier or entity-like object.
     *
     * @param idOrEntity ObjectID value or object carrying `ObjectID`/`id`.
     * @returns `true` when the delete operation succeeds.
     * @throws RallyValidationError When an ObjectID cannot be resolved from the argument.
     */
    async remove(idOrEntity: string | number | { ObjectID?: string | number; id?: string | number }): Promise<boolean> {
        let objectId: string | number | undefined;

        if (typeof idOrEntity === 'string' || typeof idOrEntity === 'number') {
            objectId = String(idOrEntity);
        } else if (idOrEntity && typeof idOrEntity === 'object') {
            objectId = idOrEntity.ObjectID || idOrEntity.id;
        }

        if (!objectId) {
            throw new RallyValidationError('Cannot determine ObjectID from provided argument');
        }

        await this.delete(objectId);
        return true;
    }

    /**
     * Count entities matching the provided filter.
     *
     * @param where Object-based filter converted to a Rally query string.
     * @returns Number of matching entities reported by Rally.
     */
    async count(where: Record<string, unknown> = {}): Promise<number> {
        this._warnNonFilterableFields(where);
        const query = this._buildQuery(where);
        return this.client.queryCount(this.entityType, { query });
    }

    /**
     * Check whether any entity matches the provided filter.
     *
     * @param where Object-based filter converted to a Rally query string.
     * @returns `true` when at least one matching entity exists.
     */
    async exists(where: Record<string, unknown> = {}): Promise<boolean> {
        const entity = await this.findOneBy({ where, select: 'ObjectID' });
        return entity !== null;
    }

    /**
     * Build Rally query string from criteria object
     */
    private _buildQuery(where: any): string {
        if (typeof where === 'string') {
            return where.trim() || '';
        }

        if (!where || typeof where !== 'object') {
            return '';
        }

        const conditions: string[] = [];

        if (Array.isArray(where.$or)) {
            const orConditions = where.$or.map((condition: any) => this._buildQuery(condition)).filter(Boolean);
            if (orConditions.length > 0) {
                conditions.push(`(${orConditions.join(' OR ')})`);
            }
        }

        if (Array.isArray(where.$and)) {
            const andConditions = where.$and.map((condition: any) => this._buildQuery(condition)).filter(Boolean);
            if (andConditions.length > 0) {
                conditions.push(`(${andConditions.join(' AND ')})`);
            }
        }

        for (const [field, value] of Object.entries(where as Record<string, any>)) {
            if (field.startsWith('$')) {
                continue;
            }

            const condition = this._buildFieldCondition(field, value);
            if (condition) {
                conditions.push(condition);
            }
        }

        if (conditions.length === 0) {
            return '';
        }

        return conditions.length === 1 ? conditions[0] : `(${conditions.join(' AND ')})`;
    }

    /**
     * Build condition for a single field
     */
    private _buildFieldCondition(field: string, value: any): string {
        if (value === undefined) {
            return '';
        }

        if (value === null) {
            return `(${this._escapeField(field)} = null)`;
        }

        if (Array.isArray(value)) {
            const items = value.filter(v => v !== undefined && v !== null);
            if (items.length === 0) { return ''; }
            const parts = items.map(v => this._buildEqualityCondition(field, v)).filter(Boolean);
            if (parts.length === 0) { return ''; }
            return parts.length === 1 ? parts[0] : `(${parts.join(' OR ')})`;
        }

        if (typeof value === 'object' && !this._isOperatorObject(value)) {
            const refCondition = this._buildEntityRefCondition(field, value);
            if (refCondition) {
                return refCondition;
            }
            const nestedConditions = Object.entries(value)
                .map(([nestedField, nestedValue]) =>
                    this._buildFieldCondition(`${field}.${nestedField}`, nestedValue)
                )
                .filter(Boolean);

            return nestedConditions.length > 1
                ? `(${nestedConditions.join(' AND ')})`
                : nestedConditions[0] || '';
        }

        if (typeof value === 'object' && this._isOperatorObject(value)) {
            return this._buildOperatorConditions(field, value);
        }

        return this._buildEqualityCondition(field, value);
    }

    /**
     * Build conditions for operator objects
     */
    private _buildOperatorConditions(field: string, operators: Record<string, any>): string {
        const conditions: string[] = [];

        for (const [operator, operatorValue] of Object.entries(operators)) {
            if (operatorValue === undefined || operatorValue === null) {
                continue;
            }

            switch (operator) {
                case '$eq':
                    conditions.push(this._buildEqualityCondition(field, operatorValue));
                    break;
                case '$ne':
                    conditions.push(this._buildInequalityCondition(field, operatorValue));
                    break;
                case '$gt':
                    conditions.push(`(${this._escapeField(field)} > "${this._escapeValue(operatorValue)}")`);
                    break;
                case '$gte':
                    conditions.push(`(${this._escapeField(field)} >= "${this._escapeValue(operatorValue)}")`);
                    break;
                case '$lt':
                    conditions.push(`(${this._escapeField(field)} < "${this._escapeValue(operatorValue)}")`);
                    break;
                case '$lte':
                    conditions.push(`(${this._escapeField(field)} <= "${this._escapeValue(operatorValue)}")`);
                    break;
                case '$contains': {
                    const containsField = this._getContainsField(field);
                    conditions.push(`(${this._escapeField(containsField)} contains "${this._escapeValue(operatorValue)}")`);
                    break;
                }
                case '$in':
                    if (Array.isArray(operatorValue) && operatorValue.length > 0) {
                        const validItems = operatorValue.filter(v => v !== null && v !== undefined);
                        if (validItems.length > 0) {
                            const inConditions = validItems
                                .map(v => this._buildEqualityCondition(field, v))
                                .filter(Boolean);
                            if (inConditions.length > 0) {
                                conditions.push(`(${inConditions.join(' OR ')})`);
                            }
                        }
                    }
                    break;
                default:
                    throw new RallyValidationError(`Unsupported query operator: ${operator}`);
            }
        }

        return conditions.length > 1 ? `(${conditions.join(' AND ')})` : conditions[0] || '';
    }

    private _isOperatorObject(obj: any): boolean {
        return obj && typeof obj === 'object' && Object.keys(obj).some(key => key.startsWith('$'));
    }

    private _getContainsField(field: string): string {
        const lowerField = field.toLowerCase();
        if (lowerField === 'tags' || lowerField === 'tags.name') {
            return 'Tags.Name';
        }
        return field;
    }

    private _escapeField(field: string): string {
        if (!/^[A-Za-z_][A-Za-z0-9_]*(\.([A-Za-z_][A-Za-z0-9_]*))*$/.test(field)) {
            throw new RallyValidationError(`Invalid query field path: ${field}`);
        }

        return field;
    }

    private _escapeValue(value: any): string {
        if (value && typeof value === 'object') {
            if (typeof value._ref === 'string' && value._ref) {
                const ref = this._toRelativeRef(value._ref);
                return String(ref).replace(/"/g, '\\"');
            }
            if (value.ObjectID !== undefined && value.ObjectID !== null) {
                return String(value.ObjectID).replace(/"/g, '\\"');
            }
        }
        if (typeof value === 'string') {
            const maybeRef = isRallyRef(value)
                ? this._toRelativeRef(value)
                : value;
            return String(maybeRef).replace(/"/g, '\\"');
        }
        return String(value).replace(/"/g, '\\"');
    }

    private _buildEqualityCondition(field: string, value: any): string {
        if (value && typeof value === 'object') {
            const refCondition = this._buildEntityRefCondition(field, value);
            if (refCondition) {
                return refCondition;
            }
        }
        return `(${this._escapeField(field)} = "${this._escapeValue(value)}")`;
    }

    private _buildInequalityCondition(field: string, value: any): string {
        if (value && typeof value === 'object') {
            if (typeof value._ref === 'string' && value._ref) {
                const ref = this._toRelativeRef(value._ref);
                return `(${this._escapeField(field)} != "${this._escapeValue(ref)}")`;
            }
            if (value.ObjectID !== undefined && value.ObjectID !== null) {
                return `(${this._escapeField(field)}.ObjectID != "${this._escapeValue(value.ObjectID)}")`;
            }
        }
        return `(${this._escapeField(field)} != "${this._escapeValue(value)}")`;
    }

    private _buildEntityRefCondition(field: string, obj: any): string {
        if (!obj || typeof obj !== 'object') { return ''; }
        if (typeof obj._ref === 'string' && obj._ref) {
            const ref = this._toRelativeRef(obj._ref);
            return `(${this._escapeField(field)} = "${this._escapeValue(ref)}")`;
        }
        if (obj.ObjectID !== undefined && obj.ObjectID !== null) {
            return `(${this._escapeField(field)}.ObjectID = "${this._escapeValue(obj.ObjectID)}")`;
        }
        return '';
    }

    private _toRelativeRef(ref: string): string {
        const baseUrl = (this.client && typeof this.client.baseUrl === 'string') ? this.client.baseUrl : '';
        return toRelativeRef(ref, baseUrl) || ref;
    }

    private _normalizeOptions(options: IFindOptions = {}): any {
        const normalized: any = { ...options };

        if (normalized.orderBy && !normalized.order) { normalized.order = normalized.orderBy; }
        if (normalized.pageSize && !normalized.pagesize) { normalized.pagesize = normalized.pageSize; }
        if (normalized.limit && !normalized.maxResults) { normalized.maxResults = normalized.limit; }

        if ('fetch' in normalized || 'include' in normalized) {
            // Pre-2.0 option names. TypeScript callers get a compile error; JS callers get this hint.
            this.client.logger?.warn(
                `[${this.entityType}] The \`fetch\` and \`include\` query options were replaced by \`select\` in RallyORM 2.0 and are ignored. ` +
                'Pass field and relation paths through `select` instead.'
            );
        }

        const { fetch, include } = this._parseSelect(normalized.select);
        normalized.fetch = fetch.length > 0 ? fetch.join(',') : undefined;
        normalized.include = include;
        delete normalized.select;

        if (typeof normalized.order === 'string') {
            normalized.order = normalized.order.trim();
            this._warnNonSortableField(normalized.order);
        }
        if (typeof normalized.fetch === 'string') { normalized.fetch = normalized.fetch.trim(); }
        if (normalized.include && normalized.include.length === 0) { normalized.include = undefined; }

        return normalized;
    }

    /**
     * Parse `select` into the internal `fetch` (WSAPI fields) and `include` (eager-load paths).
     *
     * Rules:
     * - Dot-notation path `'Owner.Email'` → base `'Owner'` goes into `fetch`; full path into `include`.
     * - Plain name `'Name'` → added to `fetch` and also to `include` so single-segment
     *   relation names (e.g. `'TestCases'`) can trigger eager loading via the smart isLeaf filter.
     * - Type-filter suffix `'WorkProducts[HierarchicalRequirement]'` is stripped for `fetch`
     *   but kept verbatim in `include` for the relationship loader to parse.
     */
    private _parseSelect(selectSpec?: string | string[]): { fetch: string[], include: string[] } {
        if (!selectSpec) {
            return { fetch: [], include: [] };
        }

        let fieldArray: string[] = [];
        if (typeof selectSpec === 'string') {
            fieldArray = selectSpec.split(',').map(f => f.trim()).filter(f => f);
        } else if (Array.isArray(selectSpec)) {
            fieldArray = selectSpec.map(f => String(f).trim()).filter(f => f);
        } else {
            return { fetch: [], include: [] };
        }

        const fetch: string[] = [];
        const include: string[] = [];

        for (const field of fieldArray) {
            if (field === '*') {
                // Wildcard: fetch all fields of the top-level entity (fetch=true in WSAPI).
                return { fetch: ['true'], include: [] };
            }
            if (field.includes('.')) {
                // Dot path: add the type-filter-stripped base to fetch, full path to include.
                include.push(field);
                const baseName = field.split('.')[0].replace(/\[[^\]]+\]$/, '');
                if (!fetch.includes(baseName)) {
                    fetch.push(baseName);
                }
            } else {
                // Plain field: add stripped name to fetch; add verbatim to include so
                // single-segment relation names can still trigger eager loading.
                const baseName = field.replace(/\[[^\]]+\]$/, '');
                if (!fetch.includes(baseName)) {
                    fetch.push(baseName);
                }
                if (!include.includes(field)) {
                    include.push(field);
                }
            }
        }

        return { fetch, include };
    }

    private _hydrateIncludedRelationships(entities: T | T[], includes: string[]): void {
        const includeTree = this._buildIncludeTree(includes);
        const entityArray = Array.isArray(entities) ? entities : [entities];

        for (const entity of entityArray) {
            if (entity instanceof RallyEntity) {
                this._hydrateEntityRelations(entity, includeTree);
            }
        }
    }

    private _buildIncludeTree(includes: string[]): Record<string, IIncludeNode> {
        const includeTree: Record<string, IIncludeNode> = {};

        for (const include of includes) {
            // Strip any `[TypeFilter]` suffix so the hydration lookup uses only plain relation names.
            const parts = include.split('.').map(part => part.replace(/\[[^\]]+\]$/, '').trim()).filter(Boolean);
            if (parts.length === 0) {
                continue;
            }

            let current = includeTree;
            for (const part of parts) {
                if (!current[part]) {
                    current[part] = { children: {} };
                }
                current = current[part].children;
            }
        }

        return includeTree;
    }

    private _hydrateEntityRelations(entity: RallyEntity, includeTree: Record<string, IIncludeNode>): void {
        const relations = (entity.constructor as typeof RallyEntity).relations || {};

        for (const [relationName, includeNode] of Object.entries(includeTree)) {
            const relation = relations[relationName];
            if (!relation) {
                continue;
            }

            const rawValue = entity._data?.[relationName];
            const hydratedValue = this._hydrateRelationValue(rawValue, relation.entity, includeNode.children);

            if (hydratedValue !== undefined) {
                entity._relationCache.set(relationName, hydratedValue);
            }
        }
    }

    private _hydrateRelationValue(value: any, relationEntityType: string | undefined, nestedIncludeTree: Record<string, IIncludeNode>): any {
        if (Array.isArray(value)) {
            return value.map(item => this._hydrateRelationValue(item, relationEntityType, nestedIncludeTree));
        }

        if (!value || typeof value !== 'object') {
            return value;
        }

        const wrapped = this._wrapRelatedEntity(value, relationEntityType);
        if (!(wrapped instanceof RallyEntity)) {
            return wrapped;
        }

        if (Object.keys(nestedIncludeTree).length > 0) {
            this._hydrateEntityRelations(wrapped, nestedIncludeTree);
        }

        return wrapped;
    }

    private _wrapRelatedEntity(value: any, relationEntityType: string | undefined): any {
        if (value instanceof RallyEntity) {
            return value;
        }

        const detectedType = normalizeEntityType(relationEntityType)
            || normalizeEntityType(value?._type)
            || getEntityTypeFromRef(value?._ref);
        const RelatedModel = detectedType ? this.modelRegistry[detectedType] : undefined;

        if (!RelatedModel) {
            return value;
        }

        const HydratedModel = RelatedModel as typeof RallyEntity;
        return new HydratedModel(value, { dataSource: this.dataSource ?? undefined });
    }

    private _stripReadOnlyFields(entity: any): any {
        if (!entity || typeof entity !== 'object') {
            return entity;
        }

        const cleaned = { ...entity };

        // Always remove system-level metadata fields
        const systemFields = [
            'ObjectID', '_ref', '_type', '_CreatedAt', '_UpdatedAt',
            'CreationDate', 'LastUpdateDate', '_objectVersion',
            '_rallyAPIMajor', '_rallyAPIMinor', '_refObjectUUID',
            '_tagsNameArray', 'FormattedID'
        ];
        for (const field of systemFields) {
            delete cleaned[field];
        }

        // Also remove fields and relations marked readOnly in the model class hierarchy
        if (this.modelClass) {
            let cls: any = this.modelClass;
            while (cls && cls !== Object) {
                if (Object.prototype.hasOwnProperty.call(cls, 'fields')) {
                    for (const [name, def] of Object.entries(cls.fields as Record<string, any>)) {
                        if (def?.readOnly) delete cleaned[name];
                    }
                }
                if (Object.prototype.hasOwnProperty.call(cls, 'relations')) {
                    for (const [name, def] of Object.entries(cls.relations as Record<string, any>)) {
                        if (def?.readOnly) delete cleaned[name];
                    }
                }
                cls = Object.getPrototypeOf(cls);
            }
        }

        return cleaned;
    }

    private _isDirtyTrackableEntity(value: any): value is RallyEntity {
        return !!value
            && typeof value === 'object'
            && typeof value.getChanges === 'function'
            && typeof value.commit === 'function';
    }

    /** Walk the model class prototype chain to find a field definition by name. */
    private _findFieldDef(fieldName: string): Record<string, any> | undefined {
        if (!this.modelClass) return undefined;
        let cls: any = this.modelClass;
        while (cls && cls !== Object) {
            if (Object.prototype.hasOwnProperty.call(cls, 'fields')) {
                const def = (cls.fields as Record<string, any>)[fieldName];
                if (def !== undefined) return def;
            }
            cls = Object.getPrototypeOf(cls);
        }
        return undefined;
    }

    /**
     * Emit a logger warning for each where-clause field marked filterable:false in the model.
     * Called before building a query string in findBy/findAllBy.
     */
    private _warnNonFilterableFields(where: Record<string, any>): void {
        if (!this.modelClass || !where || typeof where !== 'object') return;

        const check = (obj: Record<string, any>) => {
            for (const [key, value] of Object.entries(obj)) {
                if (key === '$or' && Array.isArray(value)) {
                    value.forEach(cond => check(cond));
                } else if (key === '$and' && Array.isArray(value)) {
                    value.forEach(cond => check(cond));
                } else if (!key.startsWith('$')) {
                    const fieldName = key.split('.')[0];
                    const def = this._findFieldDef(fieldName);
                    if (def?.filterable === false) {
                        this.client.logger?.warn(
                            `[${this.entityType}] Field "${fieldName}" is marked as non-filterable — this query may be rejected by Rally`
                        );
                    }
                }
            }
        };

        check(where);
    }

    /**
     * Emit a logger warning when an order expression references a field marked sortable:false.
     * Called after order is normalized in _normalizeOptions.
     */
    private _warnNonSortableField(order: string): void {
        if (!this.modelClass || !order) return;
        const fieldName = order.trim().split(/\s+/)[0];
        const def = this._findFieldDef(fieldName);
        if (def?.sortable === false) {
            this.client.logger?.warn(
                `[${this.entityType}] Field "${fieldName}" is marked as non-sortable — this order expression may be rejected by Rally`
            );
        }
    }

    private _isEntityRefLike(val: any): boolean {
        return val && typeof val === 'object' && (typeof val._ref === 'string' || val.ObjectID !== undefined);
    }

    private _normalizeRefObject(obj: any): { _ref?: string; ObjectID?: any } | null {
        if (!obj || typeof obj !== 'object') { return null; }
        if (typeof obj._ref === 'string' && obj._ref) {
            const ref = this._toRelativeRef(obj._ref);
            if (typeof ref === 'string' && isRallyRef(ref)) { return { _ref: ref }; }
            return null;
        }
        if (obj.ObjectID !== undefined && obj.ObjectID !== null) {
            return { ObjectID: obj.ObjectID };
        }
        return null;
    }

    private async _prepareSaveData(data: any): Promise<any> {
        const base = this._stripReadOnlyFields(data || {});
        return this._normalizeWriteObject(base);
    }

    private async _normalizeWriteObject(input: Record<string, any>): Promise<Record<string, any>> {
        const out: Record<string, any> = {};

        for (const [key, val] of Object.entries(input)) {
            const normalized = await this._normalizeWriteValue(key, val);
            if (normalized !== undefined) {
                out[key] = normalized;
            }
        }

        return out;
    }

    private async _normalizeWriteValue(key: string, val: any): Promise<any> {
        if (val === undefined) {
            return undefined;
        }

        if (val === null) {
            return null;
        }

        if (typeof val !== 'object') {
            return val;
        }

        if (key.toLowerCase() === 'tags' && Array.isArray(val)) {
            const refs = val
                .map((tagValue: any) => {
                    if (typeof tagValue === 'string') {
                        return tagValue;
                    }

                    if (tagValue && typeof tagValue === 'object') {
                        if (typeof tagValue._ref === 'string') {
                            return { _ref: this._toRelativeRef(tagValue._ref) };
                        }

                        if (tagValue.Name || tagValue.name) {
                            return String(tagValue.Name || tagValue.name);
                        }
                    }

                    return null;
                })
                .filter(Boolean);

            const strings = refs.filter(item => typeof item === 'string');
            const rawObjects = refs.filter((item): item is { _ref: string } => typeof item === 'object');
            const seenRefs = new Set<string>();
            const objects = rawObjects.filter(obj => {
                const ref = obj._ref;
                if (seenRefs.has(ref)) { return false; }
                seenRefs.add(ref);
                return true;
            });
            let processed: Array<{ _ref: string }> = objects;

            if (strings.length > 0) {
                const created = await this._processTagsArray(strings);
                processed = [...objects, ...created];
            }

            return processed.length > 0 ? processed : undefined;
        }

        if (this._isEntityRefLike(val)) {
            return this._normalizeRefObject(val) ?? undefined;
        }

        if (Array.isArray(val)) {
            const normalizedArray: any[] = [];
            for (const item of val) {
                const normalizedItem = await this._normalizeArrayItem(item);
                if (normalizedItem !== undefined) {
                    normalizedArray.push(normalizedItem);
                }
            }
            return normalizedArray;
        }

        const nestedObject = await this._normalizeWriteObject(this._stripReadOnlyFields(val));
        return Object.keys(nestedObject).length > 0 ? nestedObject : undefined;
    }

    private async _normalizeArrayItem(item: any): Promise<any> {
        if (item === undefined) {
            return undefined;
        }

        if (item === null) {
            return null;
        }

        if (typeof item !== 'object') {
            return item;
        }

        if (this._isEntityRefLike(item)) {
            return this._normalizeRefObject(item) ?? undefined;
        }

        if (Array.isArray(item)) {
            const nestedArray: any[] = [];
            for (const nestedItem of item) {
                const normalizedNestedItem = await this._normalizeArrayItem(nestedItem);
                if (normalizedNestedItem !== undefined) {
                    nestedArray.push(normalizedNestedItem);
                }
            }
            return nestedArray;
        }

        const nestedObject = await this._normalizeWriteObject(this._stripReadOnlyFields(item));
        return Object.keys(nestedObject).length > 0 ? nestedObject : undefined;
    }

    private async _processTagsArray(tagNames: string[]): Promise<ITagRef[]> {
        if (!Array.isArray(tagNames)) {
            return [];
        }

        const validTagNames = [...new Set(tagNames.filter(name =>
            typeof name === 'string' && name.trim().length > 0
        ).map(name => name.trim()))];

        if (validTagNames.length === 0) {
            return [];
        }

        this.client.logger?.debug(`[${this.entityType}] Processing tags: ${validTagNames.join(', ')}`);

        const resolvedTags = new Map<string, IRallyTagData>();

        // Batch-find all requested tags in a single query to minimise round-trips
        try {
            const existingTags = await this._findTagsByNames(validTagNames);
            for (const tag of existingTags) {
                if (tag?.Name) {
                    resolvedTags.set(tag.Name, tag);
                }
            }
        } catch (error: any) {
            this.client.logger?.error(`[${this.entityType}] Failed to batch-find tags:`, error.message);
            throw error;
        }

        const missingTagNames = validTagNames.filter(name => !resolvedTags.has(name));

        if (missingTagNames.length > 0) {
            this.client.logger?.warn(
                `[${this.entityType}] Creating ${missingTagNames.length} tag(s): ${missingTagNames.join(', ')}. ` +
                'This operation is not atomic — tags already created will not be rolled back on failure.'
            );
        }

        for (const tagName of missingTagNames) {
            try {
                const tag = await this._resolveMissingTag(tagName);
                resolvedTags.set(tagName, tag);
            } catch (error: any) {
                throw new RallyOperationError(
                    `Failed to resolve or create Rally tags for ${this.entityType}: ${tagName}`,
                    [error.message ?? `Could not create tag: ${tagName}`]
                );
            }
        }

        const tagReferences = validTagNames
            .filter(tagName => !!resolvedTags.get(tagName)?._ref)
            .map(tagName => ({ _ref: resolvedTags.get(tagName)!._ref as string }));

        this.client.logger?.debug(`[${this.entityType}] Processed ${tagReferences.length} tag references`);
        return tagReferences;
    }

    private async _resolveMissingTag(tagName: string): Promise<IRallyTagData> {
        try {
            const createdTag = await this._createTag(tagName);
            if (createdTag?._ref) {
                return createdTag;
            }

            this.client.logger?.warn(
                `[${this.entityType}] Tag create for "${tagName}" returned no _ref; re-checking Rally before failing`
            );
        } catch (error: any) {
            this.client.logger?.warn(
                `[${this.entityType}] Tag create for "${tagName}" failed; re-checking Rally in case it was created concurrently: ${error.message ?? error}`
            );
        }

        const existingTag = await this._findTagByName(tagName);
        if (existingTag?._ref) {
            return existingTag;
        }

        throw new RallyOperationError(
            `Failed to resolve or create Rally tags for ${this.entityType}: ${tagName}`,
            [`Could not create tag: ${tagName}`]
        );
    }

    private async _findTagsByNames(tagNames: string[]): Promise<IRallyTagData[]> {
        if (tagNames.length === 0) {
            return [];
        }

        const queryParts = tagNames.map(name => `(Name = "${this._escapeValue(name)}")`);
        const query = queryParts.length === 1 ? queryParts[0] : `(${queryParts.join(' OR ')})`;

        return this.client.query<IRallyTagData>('tag', {
            query,
            fetch: 'ObjectID,Name',
            pagesize: Math.min(tagNames.length + 10, 2000)
        });
    }

    private async _findTagByName(tagName: string): Promise<IRallyTagData | null> {
        const matches = await this._findTagsByNames([tagName]);
        return matches.find(tag => tag?.Name === tagName) ?? null;
    }

    private async _createTag(tagName: string): Promise<IRallyTagData> {
        try {
            this.client.logger?.info(`[${this.entityType}] Creating tag: ${tagName}`);
            const tag = await this.client.create<IRallyTagData>('tag', { Name: tagName });
            this.client.logger?.info(`[${this.entityType}] Successfully created tag "${tagName}" with ObjectID: ${tag?.ObjectID}`);
            return tag;
        } catch (error: any) {
            this.client.logger?.error(`[${this.entityType}] Failed to create tag "${tagName}":`, error.message);
            throw error;
        }
    }

    private _wrapEntities(entities: any[]): T[] {
        if (!this.modelClass || !Array.isArray(entities)) {
            return entities;
        }
        return entities.map(entity => this._wrapEntity(entity));
    }

    private _wrapEntity(entity: any): T {
        if (!this.modelClass || !entity) {
            return entity;
        }

        const context = { dataSource: this.dataSource ?? undefined };
        const wrappedEntity = new this.modelClass(entity, context);
        // Copy Rally metadata fields onto the wrapped entity
        if (wrappedEntity._data) {
            wrappedEntity._data._type = entity._type;
            wrappedEntity._data._ref = entity._ref;
        }

        return wrappedEntity as T;
    }

    clearRelationshipCache(): void {
        this.relationshipLoader.clearCache();
    }
}

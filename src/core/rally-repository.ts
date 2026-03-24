import { RelationshipLoader } from './relationship-loader.js';
import { isRallyRef, toRelativeRef } from './ref-utils.js';
import type { RallyClient, IQueryOptions } from './rally-client.js';
import type { RallyDataSource } from './rally-datasource.js';
import { RallyEntity } from '../models/base-entity.js';

export interface IFindOptions extends IQueryOptions {
    include?: string[];
    where?: Record<string, any>;
}

/**
 * Repository pattern implementation for Rally entities
 * Provides repository pattern interface for CRUD operations
 */
export class RallyRepository<T extends RallyEntity = any> {
    entityType: string;
    client: RallyClient;
    modelClass: typeof RallyEntity;
    modelRegistry: Record<string, typeof RallyEntity>;
    dataSource: RallyDataSource | null;
    relationshipLoader: RelationshipLoader;

    /**
     * Create a new Rally repository
     */
    constructor(
        entityType: string,
        rallyClient: RallyClient,
        modelClass: any = null,
        modelRegistry: Record<string, any> = {},
        dataSource: RallyDataSource | null = null
    ) {
        if (!entityType || typeof entityType !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }
        if (!rallyClient || typeof rallyClient.query !== 'function') {
            throw new Error('Rally client is required and must be a valid RallyClient instance');
        }

        this.entityType = entityType;
        this.client = rallyClient;
        this.modelClass = modelClass;
        this.modelRegistry = modelRegistry;
        this.dataSource = dataSource;
        this.relationshipLoader = new RelationshipLoader(rallyClient);
    }

    /**
     * Find entities with basic options
     */
    async find(options: IFindOptions = {}): Promise<T[]> {
        const normalized = this._normalizeOptions(options);
        const { include, ...queryOptions } = normalized;

        let entities = await this.client.query(this.entityType, queryOptions);

        entities = this._wrapEntities(entities);

        if (include && include.length > 0) {
            entities = await this.relationshipLoader.loadRelationships(
                entities,
                include,
                this.modelRegistry
            );
        }

        return entities;
    }

    /**
     * Find entities matching specific criteria
     */
    async findBy(options: IFindOptions = {}): Promise<T[]> {
        const { where = {}, ...otherOptions } = options;

        const query = this._buildQuery(where);
        const normalized = this._normalizeOptions(otherOptions);
        const { include, ...queryOptions } = normalized;

        this.client.logger?.debug(`[${this.entityType}] Query: ${query}`);

        let entities = await this.client.query(this.entityType, {
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
        }

        return entities;
    }

    /**
     * Find all entities matching criteria (handles pagination automatically)
     */
    async findAllBy(options: IFindOptions = {}): Promise<T[]> {
        const { where = {}, ...otherOptions } = options;

        const query = this._buildQuery(where);
        const normalized = this._normalizeOptions(otherOptions);
        const { include, ...queryOptions } = normalized;

        this.client.logger?.debug(`[${this.entityType}] QueryAll: ${query}`);

        let entities = await this.client.queryAll(this.entityType, {
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
        }

        return entities;
    }

    /**
     * Find a single entity by ID or criteria
     */
    async findOne(idOrWhere: string | number | Record<string, any>, options: IFindOptions = {}): Promise<T | null> {
        let entity: any;

        if (typeof idOrWhere === 'string' || typeof idOrWhere === 'number') {
            const normalized = this._normalizeOptions(options);
            const { include, ...queryOptions } = normalized;

            entity = await this.client.get(this.entityType, String(idOrWhere), queryOptions);

            if (!entity) {
                return null;
            }

            entity = this._wrapEntity(entity);

            if (include && include.length > 0) {
                entity = await this.relationshipLoader.loadRelationships(
                    entity,
                    include,
                    this.modelRegistry
                );
            }

            return entity as T;
        } else {
            const where = idOrWhere;
            return this.findOneBy({ where, ...options });
        }
    }

    /**
     * Find a single entity matching criteria
     */
    async findOneBy(options: IFindOptions = {}): Promise<T | null> {
        const results = await this.findBy({ ...options, pagesize: 1, start: 1 });
        return results[0] ?? null;
    }

    /**
     * Create a new entity
     */
    async create(entityData: any): Promise<T> {
        if (!entityData || typeof entityData !== 'object') {
            throw new Error('Entity data is required and must be an object');
        }

        const cleanData = await this._prepareSaveData(entityData);

        const result = await this.client.create(this.entityType, cleanData);
        return this._wrapEntity(result);
    }

    /**
     * Update an existing entity
     */
    async update(objectId: string | number | undefined, updateData: any): Promise<T> {
        if (!objectId) {
            throw new Error('ObjectID is required');
        }
        if (!updateData || typeof updateData !== 'object') {
            throw new Error('Update data is required and must be an object');
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
     * Save an entity (create if new, update if exists)
     */
    async save(entity: any): Promise<T> {
        if (!entity || typeof entity !== 'object') {
            throw new Error('Entity is required and must be an object');
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
            const prepared = await this._prepareSaveData(raw);
            return this.create(prepared);
        }
    }

    /**
     * Delete an entity
     */
    async delete(objectId: string | number): Promise<boolean> {
        if (!objectId) {
            throw new Error('ObjectID is required');
        }

        return this.client.delete(this.entityType, objectId);
    }

    /**
     * Remove an entity (alias for delete)
     */
    async remove(idOrEntity: string | number | any): Promise<boolean> {
        let objectId;

        if (typeof idOrEntity === 'string' || typeof idOrEntity === 'number') {
            objectId = String(idOrEntity);
        } else if (idOrEntity && typeof idOrEntity === 'object') {
            objectId = idOrEntity.ObjectID || idOrEntity.id;
        }

        if (!objectId) {
            throw new Error('Cannot determine ObjectID from provided argument');
        }

        return this.delete(objectId);
    }

    /**
     * Count entities matching criteria
     */
    async count(where: Record<string, any> = {}): Promise<number> {
        const query = this._buildQuery(where);
        if (typeof this.client.queryCount === 'function') {
            return this.client.queryCount(this.entityType, { query });
        }
        const results = await this.client.query(this.entityType, {
            query,
            pagesize: 1,
            start: 1,
            fetch: 'ObjectID'
        });
        return results.length;
    }

    /**
     * Check if any entities match the criteria
     */
    async exists(where: Record<string, any> = {}): Promise<boolean> {
        const entity = await this.findOneBy({ where, fetch: 'ObjectID' });
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

        if (Array.isArray(where.$or)) {
            const orConditions = where.$or.map((condition: any) => this._buildQuery(condition)).filter(Boolean);
            return orConditions.length > 0 ? `(${orConditions.join(' OR ')})` : '';
        }

        if (Array.isArray(where.$and)) {
            const andConditions = where.$and.map((condition: any) => this._buildQuery(condition)).filter(Boolean);
            return andConditions.length > 0 ? `(${andConditions.join(' AND ')})` : '';
        }

        const conditions: string[] = [];

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
        if (value === undefined || value === null) {
            return '';
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
                        const inConditions = operatorValue
                            .map(v => this._buildEqualityCondition(field, v))
                            .filter(Boolean);
                        conditions.push(`(${inConditions.join(' OR ')})`);
                    }
                    break;
                default:
                    throw new Error(`Unsupported query operator: ${operator}`);
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
        if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(field)) {
            throw new Error(`Invalid query field path: ${field}`);
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

        if (normalized.fetch) {
            const { fetch, include } = this._parseUnifiedFetch(normalized.fetch);
            normalized.fetch = fetch.length > 0 ? fetch.join(',') : undefined;
            if (include.length > 0) {
                normalized.include = include;
            }
        }

        if (typeof normalized.order === 'string') { normalized.order = normalized.order.trim(); }
        if (typeof normalized.fetch === 'string') { normalized.fetch = normalized.fetch.trim(); }

        return normalized;
    }

    private _parseUnifiedFetch(fetchSpec: string | string[]): { fetch: string[], include: string[] } {
        if (!fetchSpec) {
            return { fetch: [], include: [] };
        }

        let fieldArray: string[] = [];
        if (typeof fetchSpec === 'string') {
            fieldArray = fetchSpec.split(',').map(f => f.trim()).filter(f => f);
        } else if (Array.isArray(fetchSpec)) {
            fieldArray = fetchSpec.map(f => String(f).trim()).filter(f => f);
        } else {
            return { fetch: [], include: [] };
        }

        const fetch: string[] = [];
        const include: string[] = [];

        for (const field of fieldArray) {
            if (field.includes('.')) {
                include.push(field);
                const baseField = field.split('.')[0];
                if (!fetch.includes(baseField)) {
                    fetch.push(baseField);
                }
            } else {
                fetch.push(field);
            }
        }

        return { fetch, include };
    }

    private _stripReadOnlyFields(entity: any): any {
        if (!entity || typeof entity !== 'object') {
            return entity;
        }

        const readOnlyFields = [
            'ObjectID', '_ref', '_type', '_CreatedAt', '_UpdatedAt',
            'CreationDate', 'LastUpdateDate', '_objectVersion',
            '_rallyAPIMajor', '_rallyAPIMinor', '_refObjectUUID',
            '_tagsNameArray', 'FormattedID'
        ];

        const cleaned = { ...entity };
        readOnlyFields.forEach(field => delete cleaned[field]);

        return cleaned;
    }

    private _isDirtyTrackableEntity(value: any): value is RallyEntity {
        return !!value
            && typeof value === 'object'
            && typeof value.getChanges === 'function'
            && typeof value.commit === 'function';
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
            const objects = refs.filter(item => typeof item === 'object');
            let processed = objects;

            if (strings.length > 0) {
                try {
                    const created = await this._processTagsArray(strings);
                    processed = [...objects, ...created];
                } catch {
                    processed = objects;
                }
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

    private async _processTagsArray(tagNames: string[]): Promise<any[]> {
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

        const tagReferences: any[] = [];

        for (const tagName of validTagNames) {
            try {
                let tag = await this._findTagByName(tagName);
                if (!tag) {
                    tag = await this._createTag(tagName);
                }
                if (tag && tag._ref) {
                    tagReferences.push({ _ref: tag._ref });
                }
            } catch (error: any) {
                this.client.logger?.error(`[${this.entityType}] Failed to process tag "${tagName}":`, error.message);
            }
        }

        this.client.logger?.debug(`[${this.entityType}] Processed ${tagReferences.length} tag references`);
        return tagReferences;
    }

    private async _findTagByName(tagName: string): Promise<any> {
        try {
            const results = await this.client.query('tag', {
                query: `(Name = "${this._escapeValue(tagName)}")`,
                fetch: 'ObjectID,Name',
                pagesize: 1
            });
            return results.length > 0 ? results[0] : null;
        } catch (error: any) {
            this.client.logger?.error(`[${this.entityType}] Failed to find tag "${tagName}":`, error.message);
            return null;
        }
    }

    private async _createTag(tagName: string): Promise<any> {
        try {
            this.client.logger?.info(`[${this.entityType}] Creating tag: ${tagName}`);
            const tag = await this.client.create('tag', { Name: tagName });
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

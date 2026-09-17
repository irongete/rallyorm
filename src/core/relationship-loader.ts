import { toRelativeRef, toAbsoluteRef } from './ref-utils.js';
import type { RallyClient, IRelationshipLoaderOptions } from './rally-client.js';
import type { IRallyEntityData, IRelationDefinition } from '../models/base-entity.js';
import type { RallyModelClass } from '../models/registry.js';

interface IIncludeConfig {
    children: Record<string, IIncludeConfig>;
    isLeaf: boolean;
    /** Actual relation name on the entity (without any [TypeFilter] suffix). */
    relationName: string;
    /**
     * When set (lowercase), only entities of this type participate in sub-relation loading
     * during the recursion step. The load step itself is unaffected.
     */
    typeFilter?: string;
}

interface IRelationshipEntity {
    _data?: IRallyEntityData;
    _ref?: string;
    _type?: string;
    _loadedRelations?: Set<string>;
    _relationCache?: Map<string, unknown>;
    [key: string]: unknown;
}

type IModelRegistry = Record<string, RallyModelClass>;

interface ICollectionField {
    _ref?: string;
    _tagsNameArray?: unknown[];
    Count?: number;
    Results?: unknown;
}

/**
 * Relationship loading service for Rally entities.
 *
 * This helper resolves eager-loaded include paths, batches related-entity
 * lookups, and caches intermediate results while traversing relationship trees.
 */
export class RelationshipLoader {
    client: RallyClient;
    private cache: Map<string, IRelationshipEntity>;
    private maxCacheEntries: number;
    private maxDepth: number;
    private inverseQueryChunkSize: number;
    private collectionConcurrency: number;

    constructor(rallyClient: RallyClient, options: IRelationshipLoaderOptions = {}) {
        this.client = rallyClient;
        this.cache = new Map();
        this.maxCacheEntries = options.maxCacheEntries ?? 5000;
        this.maxDepth = options.maxDepth ?? 5;
        this.inverseQueryChunkSize = options.inverseQueryChunkSize ?? 50;
        this.collectionConcurrency = options.collectionConcurrency ?? 10;
    }

    /**
     * Internal warning helper that respects RallyClient logger when available.
     * Falls silent when no logger is provided.
     */
    private _warn(...args: unknown[]): void {
        const warn = this.client?.logger?.warn;
        if (typeof warn === 'function') {
            warn(...args);
        }
    }

    /**
     * Internal info helper. Only surfaces when the client logger is configured at info level
     * (e.g. debug:true or logLevel:'info'). Used to report polymorphic-collection load summaries.
     */
    private _info(...args: unknown[]): void {
        const info = this.client?.logger?.info;
        if (typeof info === 'function') {
            info(...args);
        }
    }

    private _asCollectionField(value: unknown): ICollectionField | null {
        if (!value || typeof value !== 'object') {
            return null;
        }

        return value as ICollectionField;
    }

    /**
     * Load relationships for entities based on include array
     */
    async loadRelationships<T extends IRelationshipEntity>(entities: T, includes?: string[], modelRegistry?: IModelRegistry): Promise<T>;
    async loadRelationships<T extends IRelationshipEntity>(entities: T[], includes?: string[], modelRegistry?: IModelRegistry): Promise<T[]>;
    async loadRelationships<T extends IRelationshipEntity>(entities: T | T[], includes: string[] = [], modelRegistry: IModelRegistry = {}): Promise<T | T[]> {
        if (!includes || includes.length === 0) {
            return entities;
        }

        const isArray = Array.isArray(entities);
        const entityArray = isArray ? entities : [entities];

        if (entityArray.length === 0) {
            return entities;
        }

        const includePaths = this._parseIncludePaths(includes);

        await this._loadRelationshipLevels(entityArray, includePaths, modelRegistry);

        return entities;
    }

    /**
     * Parse include paths into structured format.
     *
     * Each dot-separated segment may carry an optional type filter in square brackets:
     *   `'WorkProducts[HierarchicalRequirement].TestCases'`
     * The filter controls which loaded entities participate in nested relation loading
     * (i.e. only HierarchicalRequirement items from WorkProducts will have TestCases loaded).
     */
    private _parseIncludePaths(includes: string[]): Record<string, IIncludeConfig> {
        const paths: Record<string, IIncludeConfig> = {};
        const maxPathDepth = this.maxDepth + 1;
        // Matches optional [TypeFilter] suffix: 'WorkProducts[HierarchicalRequirement]'
        const SEGMENT_RE = /^([^[]+?)(?:\[([^\]]+)\])?$/;

        for (const include of includes) {
            const parts = include.split('.');

            if (parts.length > maxPathDepth) {
                this._warn(`RelationshipLoader: Include path exceeds maximum depth (${maxPathDepth}), skipping: ${include}`);
                continue;
            }

            let current = paths;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].trim();
                const match = part.match(SEGMENT_RE);
                const relationName = (match?.[1] ?? part).trim();
                const typeFilter = match?.[2]?.toLowerCase().trim();
                const treeKey = typeFilter ? `${relationName}[${typeFilter}]` : relationName;
                const isCurrentLeaf = i === parts.length - 1;

                if (!current[treeKey]) {
                    current[treeKey] = {
                        children: {},
                        isLeaf: isCurrentLeaf,
                        relationName,
                        typeFilter,
                    };
                } else if (!isCurrentLeaf) {
                    // A longer path passes through this node — it is no longer a terminal leaf.
                    current[treeKey].isLeaf = false;
                }
                current = current[treeKey].children;
            }
        }

        return paths;
    }

    /**
     * Load relationships level by level.
     *
     * Leaf nodes are only processed when they correspond to a known relation on at least
     * one entity type — scalar fields (e.g. 'Name') are silently skipped.
     * Type-filtered nodes (e.g. 'WorkProducts[HierarchicalRequirement]') load the relation
     * normally but restrict nested recursion to entities of the specified type.
     */
    private async _loadRelationshipLevels(entities: IRelationshipEntity[], includePaths: Record<string, IIncludeConfig>, modelRegistry: IModelRegistry, level: number = 0): Promise<void> {
        if (level > this.maxDepth) {
            this._warn(`RelationshipLoader: Maximum depth (${this.maxDepth}) reached`);
            return;
        }

        const entitiesByType = this._groupEntitiesByType(entities);

        // Leaf nodes are only kept when at least one entity type has them as a registered
        // relation. This allows `select: ['TestCases']` to eager-load while silently
        // ignoring scalar-field leaves like 'Name'.
        const relationEntries = Object.entries(includePaths).filter(([, cfg]) => {
            if (!cfg.isLeaf) return true;
            return Object.entries(entitiesByType).some(([entityType]) => {
                const ModelClass = modelRegistry[entityType];
                return ModelClass?.relations?.[cfg.relationName] !== undefined;
            });
        });

        const loadResults = await Promise.allSettled(relationEntries.map(([, relationConfig]) =>
            this._loadRelationshipForAllTypes(entitiesByType, relationConfig, modelRegistry, level)
        ));

        for (const result of loadResults) {
            if (result.status === 'rejected') {
                this._warn(`RelationshipLoader: Failed to load relationship: ${result.reason?.message ?? String(result.reason)}`);
            }
        }

        const nestedResults = await Promise.allSettled(relationEntries.map(async ([, relationConfig]) => {
            if (Object.keys(relationConfig.children).length > 0) {
                const relatedEntities = this._extractRelatedEntities(entities, relationConfig.relationName);
                // If a type filter is set, only recurse into entities of that type.
                // e.g. 'WorkProducts[HierarchicalRequirement].TestCases' →
                // only load TestCases for UserStory-typed WorkProducts.
                const filteredEntities = relationConfig.typeFilter
                    ? relatedEntities.filter(e => {
                        const type = (e.constructor as { entityType?: string | null })?.entityType?.toLowerCase()
                            || (e._type as string | undefined)?.toLowerCase();
                        return type === relationConfig.typeFilter;
                    })
                    : relatedEntities;
                if (filteredEntities.length > 0) {
                    await this._loadRelationshipLevels(filteredEntities, relationConfig.children, modelRegistry, level + 1);
                }
            }
        }));

        for (const result of nestedResults) {
            if (result.status === 'rejected') {
                this._warn(`RelationshipLoader: Failed to load nested relationship: ${result.reason?.message ?? String(result.reason)}`);
            }
        }
    }

    /**
     * Group entities by their type for batch processing
     */
    private _groupEntitiesByType(entities: IRelationshipEntity[]): Record<string, IRelationshipEntity[]> {
        const groups: Record<string, IRelationshipEntity[]> = {};

        for (const entity of entities) {
            const entityConstructor = (entity as { constructor?: { entityType?: string | null } }).constructor;
            const entityType = (entityConstructor && entityConstructor.entityType)
                || (entity && entity._type);

            if (!entityType) { continue; }

            const key = String(entityType).toLowerCase();

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(entity);
        }

        return groups;
    }

    /**
     * Load a specific relationship across all relevant entity types.
     *
     * The relation name and optional type filter come from `relationConfig`.
     * A shared progress counter keeps all entity-type groups in sync on the same bar.
     * When there are 2+ eligible entity types, per-type sub-events are emitted so the
     * telemetry reporter can render a breakdown bar per source type.
     */
    private async _loadRelationshipForAllTypes(entitiesByType: Record<string, IRelationshipEntity[]>, relationConfig: IIncludeConfig, modelRegistry: IModelRegistry, level: number): Promise<void> {
        const relationName = relationConfig.relationName;
        const entityTypeEntries = Object.entries(entitiesByType);

        const eligibleEntries = entityTypeEntries.filter(([entityType]) => {
            const ModelClass = modelRegistry[entityType];
            return ModelClass?.relations?.[relationName] !== undefined;
        });

        if (eligibleEntries.length === 0 && entityTypeEntries.length > 0) {
            this._warn(`RelationshipLoader: No registered relation "${relationName}" found on any entity type — check include path spelling`);
            return;
        }

        // Emit an info summary for polymorphic collections (visible at info log level).
        if (entityTypeEntries.length > 1) {
            const skippedEntries = entityTypeEntries.filter(([t]) => !eligibleEntries.some(([et]) => et === t));
            const loadedSummary = eligibleEntries.map(([t, es]) => `${t}×${es.length}`).join(', ');
            const skippedSummary = skippedEntries.map(([t, es]) => `${t}×${es.length}`).join(', ');
            this._info(
                `RelationshipLoader: "${relationName}" loading for ${loadedSummary}` +
                (skippedSummary ? `. Skipped (no relation): ${skippedSummary}` : '')
            );
        }

        // Shared progress counter — prevents a fast small group from marking the bar done
        // while a larger parallel group is still in flight.
        const sharedProgress = {
            loaded: 0,
            total: eligibleEntries.reduce((sum, [, entities]) => sum + entities.length, 0)
        };
        // Per-type sub-progress — only created when there are multiple eligible types
        // so the telemetry reporter can render a breakdown bar for each source type.
        const multiType = eligibleEntries.length > 1;

        const results = await Promise.allSettled(eligibleEntries.map(async ([entityType, entities]) => {
            const ModelClass = modelRegistry[entityType]!;
            const relation = ModelClass.relations![relationName];
            const entityProgress = multiType
                ? { loaded: 0, total: entities.length, sourceEntityType: ModelClass.name || entityType }
                : undefined;
            await this._loadRelationshipBatch(entities, relationName, relation, relationConfig, modelRegistry, level, sharedProgress, entityProgress);
        }));

        for (const result of results) {
            if (result.status === 'rejected') {
                this._warn(`RelationshipLoader: Failed to load "${relationName}" for entity type: ${result.reason?.message ?? String(result.reason)}`);
            }
        }
    }

    /**
     * Load relationship for a batch of entities
     */
    private async _loadRelationshipBatch(
        entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition,
        relationConfig: IIncludeConfig, modelRegistry: IModelRegistry, level: number,
        sharedProgress?: { loaded: number; total: number },
        entityProgress?: { loaded: number; total: number; sourceEntityType: string }
    ): Promise<void> {
        if (relation.type === 'belongsTo') {
            await this._loadBelongsToRelation(entities, relationName, relation, relationConfig, level);
        } else if (relation.type === 'hasMany') {
            await this._loadHasManyRelation(entities, relationName, relation, relationConfig, modelRegistry, level, sharedProgress, entityProgress);
        }
    }

    /**
     * Load belongsTo relationships (many-to-one)
     */
    private async _loadBelongsToRelation(entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition, relationConfig: IIncludeConfig, _level: number): Promise<void> {
        const foreignKeys = new Set<string>();
        const entityRefMap = new Map<string, IRelationshipEntity[]>();

        for (const entity of entities) {
            const foreignKeyValue = this._extractForeignKeyValue(entity, relation.foreignKey);
            if (foreignKeyValue) {
                foreignKeys.add(foreignKeyValue);
                if (!entityRefMap.has(foreignKeyValue)) {
                    entityRefMap.set(foreignKeyValue, []);
                }
                entityRefMap.get(foreignKeyValue)!.push(entity);
            }
        }

        if (foreignKeys.size === 0) { return; }

        const extraFetchFields = this._collectScalarLeaves(relationConfig);

        const relatedEntities = await this._batchLoadByRefs(
            relation.entity,
            Array.from(foreignKeys),
            extraFetchFields
        );

        for (const relatedEntity of relatedEntities) {
            const ref = this._toRelativeRef(relatedEntity._ref);
            if (ref) {
                const matchingEntities = entityRefMap.get(ref);
                if (matchingEntities) {
                    for (const entity of matchingEntities) {
                        this._setRelationshipValue(entity, relationName, relatedEntity);
                    }
                }
            }
        }
    }

    /**
     * Load hasMany relationships (one-to-many)
     */
    private async _loadHasManyRelation(
        entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition,
        relationConfig: IIncludeConfig, modelRegistry: IModelRegistry, level: number,
        sharedProgress?: { loaded: number; total: number },
        entityProgress?: { loaded: number; total: number; sourceEntityType: string }
    ): Promise<void> {
        if (relation.isCollection) {
            await this._loadCollectionRelation(entities, relationName, relation, relationConfig, modelRegistry, level, sharedProgress, entityProgress);
        } else {
            await this._loadInverseForeignKeyRelation(entities, relationName, relation, relationConfig, modelRegistry, level, sharedProgress, entityProgress);
        }
    }

    /**
     * Load Rally collection relationships
     */
    private async _loadCollectionRelation(
        entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition,
        relationConfig: IIncludeConfig, modelRegistry: IModelRegistry, level: number,
        sharedProgress?: { loaded: number; total: number },
        entityProgress?: { loaded: number; total: number; sourceEntityType: string }
    ): Promise<void> {
        let loaded = 0;
        const progressTotal = sharedProgress ? sharedProgress.total : entities.length;

        const processEntity = async (entity: IRelationshipEntity) => {
            const collectionField = this._asCollectionField(this._getCollectionField(entity, relationName, relation.foreignKey));
            if (!collectionField) {
                this._setRelationshipValue(entity, relationName, []);
                return;
            }

            if (Array.isArray(collectionField._tagsNameArray) && collectionField._tagsNameArray.length > 0) {
                const resolved = await this._loadTagsByNames(collectionField._tagsNameArray);
                this._setRelationshipValue(entity, relationName, resolved);
                return;
            }

            if (typeof collectionField._ref !== 'string' || collectionField._ref.length === 0) {
                this._setRelationshipValue(entity, relationName, []);
                return;
            }

            const fetch = this._buildCollectionFetchFields(relation, relationConfig, modelRegistry);
            const relatedEntities = await this.client.queryCollectionAll(collectionField._ref, {
                fetch: fetch.length > 0 ? fetch.join(',') : undefined,
                pagesize: 2000
            });

            this._setRelationshipValue(entity, relationName, relatedEntities);
        };

        const chunks = this._chunkArray(entities, this.collectionConcurrency);

        for (const chunk of chunks) {
            const results = await Promise.allSettled(chunk.map(async entity => {
                try {
                    await processEntity(entity);
                } finally {
                    loaded++;
                    const progressCurrent = sharedProgress ? ++sharedProgress.loaded : loaded;
                    this.client.emitProgress({
                        operation: 'relationship',
                        entityType: String(relation.entity),
                        relationshipName: relationName,
                        level: level + 1,
                        current: progressCurrent,
                        total: progressTotal
                    });
                    if (entityProgress) {
                        entityProgress.loaded++;
                        this.client.emitProgress({
                            operation: 'relationship',
                            entityType: String(relation.entity),
                            relationshipName: relationName,
                            level: level + 1,
                            current: entityProgress.loaded,
                            total: entityProgress.total,
                            sourceEntityType: entityProgress.sourceEntityType
                        });
                    }
                }
            }));

            for (const result of results) {
                if (result.status === 'rejected') {
                    this._warn(`RelationshipLoader: Failed to load collection "${relationName}": ${result.reason?.message ?? String(result.reason)}`);
                }
            }
        }
    }

    private _getCollectionField(entity: IRelationshipEntity, relationName: string, foreignKey?: string): unknown {
        const data = entity?._data || entity;
        if (!data || typeof data !== 'object') {
            return null;
        }

        if (relationName in data) {
            return data[relationName];
        }

        if (foreignKey && foreignKey in data) {
            return data[foreignKey];
        }

        return null;
    }

    private _buildCollectionFetchFields(relation: IRelationDefinition, relationConfig: IIncludeConfig, modelRegistry: IModelRegistry): string[] {
        const scalarLeaves = this._collectScalarLeaves(relationConfig);
        if (scalarLeaves.includes('true')) {
            return ['true'];
        }

        const fetchFields = new Set<string>(['ObjectID']);

        for (const leaf of scalarLeaves) {
            fetchFields.add(leaf);
        }

        const RelatedModel = modelRegistry?.[String(relation.entity).toLowerCase()];
        if (relationConfig && relationConfig.children && RelatedModel && RelatedModel.relations) {
            // Use cfg.relationName (not tree key) to look up the actual relation definition
            for (const childCfg of Object.values(relationConfig.children)) {
                const childRel = RelatedModel.relations[childCfg.relationName];
                if (childRel && childRel.type === 'belongsTo' && childRel.foreignKey) {
                    fetchFields.add(childRel.foreignKey);
                }
            }
        }

        return Array.from(fetchFields);
    }

    /**
     * Load inverse foreign key relationships
     */
    private async _loadInverseForeignKeyRelation(
        entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition,
        relationConfig: IIncludeConfig, modelRegistry: IModelRegistry, level: number,
        sharedProgress?: { loaded: number; total: number },
        entityProgress?: { loaded: number; total: number; sourceEntityType: string }
    ): Promise<void> {
        const entityRefs = Array.from(new Set(
            entities
                .map(entity => this._toRelativeRef(entity._ref))
                .filter((ref): ref is string => typeof ref === 'string' && ref.length > 0)
        ));

        if (entityRefs.length === 0) { return; }
        if (!relation.foreignKey || !relation.entity) {
            this._warn(`RelationshipLoader: relation ${relationName} is missing foreignKey or entity`);
            return;
        }

        const prefetchFields = new Set<string>([relation.foreignKey]);

        const scalarLeaves = this._collectScalarLeaves(relationConfig);
        const fetchAll = scalarLeaves.includes('true');
        if (!fetchAll) {
            for (const leaf of scalarLeaves) {
                prefetchFields.add(leaf);
            }
        }

        const RelatedModel = modelRegistry?.[String(relation.entity).toLowerCase()];
        if (relationConfig && relationConfig.children && RelatedModel && RelatedModel.relations) {
            for (const childCfg of Object.values(relationConfig.children)) {
                const childRel = RelatedModel.relations[childCfg.relationName];
                if (childRel && childRel.type === 'belongsTo' && childRel.foreignKey) {
                    prefetchFields.add(childRel.foreignKey);
                }
            }
        }

        const refChunks = this._chunkArray(entityRefs, this.inverseQueryChunkSize);
        const relatedEntityType = relation.entity;
        const foreignKey = relation.foreignKey;
        
        let loaded = 0;
        const progressTotal = sharedProgress ? sharedProgress.total : entityRefs.length;
        const chunkResults = await Promise.allSettled(refChunks.map(async refChunk => {
            const result = await this.client.queryAll(relatedEntityType, {
                query: this._buildInverseQuery(foreignKey, refChunk),
                fetch: fetchAll ? 'true' : Array.from(prefetchFields).join(','),
                pagesize: 2000
            });
            loaded += refChunk.length;
            const progressCurrent = sharedProgress ? (sharedProgress.loaded += refChunk.length) : loaded;
            this.client.emitProgress({
                operation: 'relationship',
                entityType: String(relation.entity),
                relationshipName: relationName,
                level: level + 1,
                current: progressCurrent,
                total: progressTotal
            });
            if (entityProgress) {
                entityProgress.loaded += refChunk.length;
                this.client.emitProgress({
                    operation: 'relationship',
                    entityType: String(relation.entity),
                    relationshipName: relationName,
                    level: level + 1,
                    current: Math.min(entityProgress.loaded, entityProgress.total),
                    total: entityProgress.total,
                    sourceEntityType: entityProgress.sourceEntityType
                });
            }
            return result;
        }));

        const relatedEntities: any[] = [];
        for (const result of chunkResults) {
            if (result.status === 'fulfilled') {
                relatedEntities.push(...result.value);
            } else {
                this._warn(`RelationshipLoader: Failed to load chunk for "${relationName}": ${result.reason?.message ?? String(result.reason)}`);
            }
        }

        const relatedByForeignKey = new Map<string, any[]>();
        for (const related of relatedEntities) {
            const foreignKeyValue = this._extractForeignKeyValue(related, relation.foreignKey);
            if (foreignKeyValue) {
                if (!relatedByForeignKey.has(foreignKeyValue)) {
                    relatedByForeignKey.set(foreignKeyValue, []);
                }
                relatedByForeignKey.get(foreignKeyValue)!.push(related);
            }
        }

        for (const entity of entities) {
            const entityRef = this._toRelativeRef(entity._ref);
            if (entityRef) {
                const relatedItems = relatedByForeignKey.get(entityRef) || [];
                this._setRelationshipValue(entity, relationName, relatedItems);
            }
        }
    }

    /**
     * Extract foreign key value from entity
     */
    private _extractForeignKeyValue(entity: IRelationshipEntity, foreignKey: string | undefined): string | null {
        if (!foreignKey) {
            return null;
        }

        const value = entity._data ? entity._data[foreignKey] : entity[foreignKey];

        if (!value) { return null; }

        if (typeof value === 'string') {
            return this._toRelativeRef(value) as string;
        }

        if (value._ref) {
            return this._toRelativeRef(value._ref) as string;
        }

        return null;
    }

    /**
     * Build query for inverse relationship
     */
    private _buildInverseQuery(foreignKey: string, entityRefs: string[]): string {
        if (entityRefs.length === 1) {
            return `(${foreignKey} = "${this._toRelativeRef(entityRefs[0])}")`;
        }

        const conditions = entityRefs.map(ref => `(${foreignKey} = "${this._toRelativeRef(ref)}")`);
        return `(${conditions.join(' OR ')})`;
    }

    private _chunkArray<T>(items: T[], chunkSize: number): T[][] {
        if (items.length === 0) {
            return [];
        }

        const chunks: T[][] = [];
        for (let index = 0; index < items.length; index += chunkSize) {
            chunks.push(items.slice(index, index + chunkSize));
        }

        return chunks;
    }

    /**
     * Batch load entities by their references
     */
    private async _batchLoadByRefs(entityType: string | undefined, refs: string[], extraFetchFields: string[] = []): Promise<IRelationshipEntity[]> {
        if (!entityType) { return []; }
        if (refs.length === 0) { return []; }

        const uncachedRefs = Array.from(new Set(refs.map(ref => this._toRelativeRef(ref) || ref))).filter(ref => {
            const rel = this._toRelativeRef(ref) as string;
            const abs = this._toAbsoluteRef(rel) as string;
            return !(this.cache.has(rel) || this.cache.has(abs));
        });

        if (uncachedRefs.length > 0) {
            const objectIds = Array.from(new Set(uncachedRefs
                .map(ref => this._extractObjectIdFromRef(ref))
                .filter(Boolean) as string[]));

            if (objectIds.length > 0) {
                const fetchAll = extraFetchFields.includes('true');
                const fetch = fetchAll
                    ? ['true']
                    : Array.from(new Set(['ObjectID', ...extraFetchFields.filter(Boolean)]));
                const chunks = this._chunkArray(objectIds, this.inverseQueryChunkSize);

                const chunkResults = await Promise.allSettled(chunks.map(chunk => {
                    const query = this._buildObjectIdQuery(chunk);
                    return this.client.queryAll(entityType, {
                        query,
                        fetch: fetch.join(','),
                        pagesize: 2000
                    }) as Promise<IRelationshipEntity[]>;
                }));

                for (const result of chunkResults) {
                    if (result.status === 'rejected') {
                        this._warn(`RelationshipLoader: Failed to batch-load ${entityType} refs: ${result.reason?.message ?? String(result.reason)}`);
                        continue;
                    }
                    for (const entity of result.value) {
                        if (entity._ref) {
                            this._setCacheEntry(entity._ref, entity);
                            const rel = this._toRelativeRef(entity._ref);
                            if (rel) {
                                this._setCacheEntry(rel, entity);
                            }
                        }
                    }
                }
            }
        }

        return refs
            .map(ref => {
                const rel = this._toRelativeRef(ref) as string;
                return this._getCacheEntry(rel) || this._getCacheEntry(this._toAbsoluteRef(rel) as string) || this._getCacheEntry(ref);
            })
            .filter((entity): entity is IRelationshipEntity => Boolean(entity));
    }

    /**
     * Collect scalar leaf field names (and relation base names) from a relationConfig subtree.
     * Uses cfg.relationName so that type-filtered keys like 'TestCases[defect]' are
     * mapped to their actual field name 'TestCases'.
     */
    private _collectScalarLeaves(relationConfig: IIncludeConfig): string[] {
        if (!relationConfig || !relationConfig.children) { return []; }

        const fields = new Set<string>();
        for (const cfg of Object.values(relationConfig.children)) {
            if (cfg) {
                if (cfg.isLeaf && cfg.relationName === '*') {
                    return ['true']; // wildcard: caller should pass fetch=true to Rally
                }
                if (cfg.isLeaf) {
                    fields.add(cfg.relationName);
                } else if (cfg.children && Object.keys(cfg.children).length > 0) {
                    fields.add(cfg.relationName);
                }
            }
        }
        return Array.from(fields);
    }

    /**
     * Extract ObjectID from Rally reference
     */
    private _extractObjectIdFromRef(ref: string): string | null {
        const r = this._toRelativeRef(ref);
        if (!r) return null;
        const match = r.match(/\/(\d+)$/);
        return match ? match[1] : null;
    }

    /**
     * Build query for multiple ObjectIDs
     */
    private _buildObjectIdQuery(objectIds: string[]): string {
        if (objectIds.length === 1) {
            return `(ObjectID = ${objectIds[0]})`;
        }

        const conditions = objectIds.map(id => `(ObjectID = ${id})`);
        return `(${conditions.join(' OR ')})`;
    }

    private _toAbsoluteRef(rel: string | null | undefined): string | null | undefined {
        const baseUrl = this.client?.baseUrl || '';
        return toAbsoluteRef(rel, baseUrl);
    }

    private _toRelativeRef(ref: string | null | undefined): string | null | undefined {
        return toRelativeRef(ref);
    }

    private _setCacheEntry(key: string, value: IRelationshipEntity): void {
        if (!key) {
            return;
        }

        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        this.cache.set(key, value);

        while (this.cache.size > this.maxCacheEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey === undefined) {
                break;
            }
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Retrieve a cached entity and promote it to most-recently-used position.
     * Returns undefined on cache miss.
     */
    private _getCacheEntry(key: string): IRelationshipEntity | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Promote to tail (most-recently-used) by deleting and re-inserting.
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    /**
     * Load tags by names
     */
    private async _loadTagsByNames(tagNames: unknown[]): Promise<IRelationshipEntity[]> {
        const names = (Array.isArray(tagNames) ? tagNames : [])
            .map(n => {
                if (typeof n === 'string') {
                    return n;
                }

                if (n && typeof n === 'object' && 'Name' in n && typeof (n as { Name?: unknown }).Name === 'string') {
                    return (n as { Name: string }).Name;
                }

                return String(n);
            })
            .filter(n => typeof n === 'string' && n.length > 0);
        const query = names
            .map(name => `(Name = "${name.replace(/"/g, '\\"')}")`)
            .join(' OR ');

        if (!query) { return []; }

        return this.client.query('tag', {
            query: `(${query})`,
            fetch: 'ObjectID,Name',
            pagesize: 1000
        });
    }

    /**
     * Set relationship value on entity
     */
    private _setRelationshipValue(entity: IRelationshipEntity, relationName: string, value: unknown): void {
        if (entity._data) {
            entity._data[relationName] = value;
        } else {
            entity[relationName] = value;
        }

        if (entity._relationCache instanceof Map) {
            entity._relationCache.delete(relationName);
        }

        if (entity._loadedRelations) {
            entity._loadedRelations.add(relationName);
        }
    }

    /**
     * Extract related entities for nested loading
     */
    private _extractRelatedEntities(entities: IRelationshipEntity[], relationName: string): IRelationshipEntity[] {
        const relatedEntities: IRelationshipEntity[] = [];

        for (const entity of entities) {
            const relationValue = entity._data ? entity._data[relationName] : entity[relationName];

            if (Array.isArray(relationValue)) {
                relatedEntities.push(...relationValue);
            } else if (relationValue) {
                relatedEntities.push(relationValue);
            }
        }

        return relatedEntities;
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

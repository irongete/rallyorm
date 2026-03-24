import { toRelativeRef, toAbsoluteRef } from './ref-utils.js';
import type { RallyClient, IRelationshipLoaderOptions } from './rally-client.js';
import type { IRallyEntityData, IRelationDefinition } from '../models/base-entity.js';
import type { RallyModelClass } from '../models/registry.js';

interface IIncludeConfig {
    children: Record<string, IIncludeConfig>;
    isLeaf: boolean;
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
 * Handles loading of entity relationships
 */
export class RelationshipLoader {
    client: RallyClient;
    private cache: Map<string, IRelationshipEntity>;
    private maxCacheEntries: number;
    private maxDepth: number;
    private inverseQueryChunkSize: number;

    constructor(rallyClient: RallyClient, options: IRelationshipLoaderOptions = {}) {
        this.client = rallyClient;
        this.cache = new Map();
        this.maxCacheEntries = options.maxCacheEntries ?? 5000;
        this.maxDepth = options.maxDepth ?? 5;
        this.inverseQueryChunkSize = options.inverseQueryChunkSize ?? 50;
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
     * Parse include paths into structured format
     */
    private _parseIncludePaths(includes: string[]): Record<string, IIncludeConfig> {
        const paths: Record<string, IIncludeConfig> = {};

        for (const include of includes) {
            const parts = include.split('.');
            let current = paths;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {
                        children: {},
                        isLeaf: i === parts.length - 1
                    };
                }
                current = current[part].children;
            }
        }

        return paths;
    }

    /**
     * Load relationships level by level
     */
    private async _loadRelationshipLevels(entities: IRelationshipEntity[], includePaths: Record<string, IIncludeConfig>, modelRegistry: IModelRegistry, level: number = 0): Promise<void> {
        if (level > this.maxDepth) {
            this._warn(`RelationshipLoader: Maximum depth (${this.maxDepth}) reached`);
            return;
        }

        const entitiesByType = this._groupEntitiesByType(entities);
        const relationEntries = Object.entries(includePaths);

        await Promise.all(relationEntries.map(([relationName, relationConfig]) =>
            this._loadRelationshipForAllTypes(
                entitiesByType,
                relationName,
                relationConfig,
                modelRegistry
            )
        ));

        await Promise.all(relationEntries.map(async ([relationName, relationConfig]) => {
            if (Object.keys(relationConfig.children).length > 0) {
                const relatedEntities = this._extractRelatedEntities(entities, relationName);
                if (relatedEntities.length > 0) {
                    await this._loadRelationshipLevels(
                        relatedEntities,
                        relationConfig.children,
                        modelRegistry,
                        level + 1
                    );
                }
            }
        }));
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
     * Load a specific relationship for all entity types
     */
    private async _loadRelationshipForAllTypes(entitiesByType: Record<string, IRelationshipEntity[]>, relationName: string, relationConfig: IIncludeConfig, modelRegistry: IModelRegistry): Promise<void> {
        await Promise.all(Object.entries(entitiesByType).map(async ([entityType, entities]) => {
            const ModelClass = modelRegistry[entityType];
            if (!ModelClass || !ModelClass.relations || !ModelClass.relations[relationName]) {
                return;
            }

            const relation = ModelClass.relations[relationName];
            await this._loadRelationshipBatch(entities, relationName, relation, relationConfig, modelRegistry);
        }));
    }

    /**
     * Load relationship for a batch of entities
     */
    private async _loadRelationshipBatch(entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition, relationConfig: IIncludeConfig, modelRegistry: IModelRegistry): Promise<void> {
        if (relation.type === 'belongsTo') {
            await this._loadBelongsToRelation(entities, relationName, relation, relationConfig);
        } else if (relation.type === 'hasMany') {
            await this._loadHasManyRelation(entities, relationName, relation, relationConfig, modelRegistry);
        }
    }

    /**
     * Load belongsTo relationships (many-to-one)
     */
    private async _loadBelongsToRelation(entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition, relationConfig: IIncludeConfig): Promise<void> {
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
    private async _loadHasManyRelation(entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition, relationConfig: IIncludeConfig, modelRegistry: IModelRegistry): Promise<void> {
        if (relation.isCollection) {
            await this._loadCollectionRelation(entities, relationName, relation, relationConfig, modelRegistry);
        } else {
            await this._loadInverseForeignKeyRelation(entities, relationName, relation, relationConfig, modelRegistry);
        }
    }

    /**
     * Load Rally collection relationships
     */
    private async _loadCollectionRelation(entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition, relationConfig: IIncludeConfig, modelRegistry: IModelRegistry): Promise<void> {
        await Promise.all(entities.map(async entity => {
            const collectionField = this._asCollectionField(this._getCollectionField(entity, relationName, relation.foreignKey));
            if (!collectionField) {
                this._setRelationshipValue(entity, relationName, []);
                return;
            }

            if (Array.isArray(collectionField._tagsNameArray) && collectionField._tagsNameArray.length > 0) {
                const tagNames = collectionField._tagsNameArray;
                const tags = await this._loadTagsByNames(tagNames);
                this._setRelationshipValue(entity, relationName, tags);
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
        }));
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
        const fetchFields = new Set<string>(['ObjectID']);

        for (const leaf of this._collectScalarLeaves(relationConfig)) {
            fetchFields.add(leaf);
        }

        const RelatedModel = modelRegistry?.[String(relation.entity).toLowerCase()];
        if (relationConfig && relationConfig.children && RelatedModel && RelatedModel.relations) {
            for (const childName of Object.keys(relationConfig.children)) {
                const childRel = RelatedModel.relations[childName];
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
    private async _loadInverseForeignKeyRelation(entities: IRelationshipEntity[], relationName: string, relation: IRelationDefinition, relationConfig: IIncludeConfig, modelRegistry: IModelRegistry): Promise<void> {
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
        for (const leaf of scalarLeaves) {
            prefetchFields.add(leaf);
        }

        const RelatedModel = modelRegistry?.[String(relation.entity).toLowerCase()];
        if (relationConfig && relationConfig.children && RelatedModel && RelatedModel.relations) {
            for (const childName of Object.keys(relationConfig.children)) {
                const childRel = RelatedModel.relations[childName];
                if (childRel && childRel.type === 'belongsTo' && childRel.foreignKey) {
                    prefetchFields.add(childRel.foreignKey);
                }
            }
        }

        const refChunks = this._chunkArray(entityRefs, this.inverseQueryChunkSize);
        const relatedEntityType = relation.entity;
        const foreignKey = relation.foreignKey;
        const relatedEntities = (await Promise.all(refChunks.map(refChunk =>
            this.client.queryAll(relatedEntityType, {
                query: this._buildInverseQuery(foreignKey, refChunk),
                fetch: Array.from(prefetchFields).join(','),
                pagesize: 2000
            })
        ))).flat();

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
                const query = this._buildObjectIdQuery(objectIds);
                const fetch = Array.from(new Set(['ObjectID', ...extraFetchFields.filter(Boolean)]));
                const entities = await this.client.queryAll(entityType, {
                    query,
                    fetch: fetch.join(','),
                    pagesize: 2000
                }) as IRelationshipEntity[];

                for (const entity of entities) {
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

        return refs
            .map(ref => {
                const rel = this._toRelativeRef(ref) as string;
                return this.cache.get(rel) || this.cache.get(this._toAbsoluteRef(rel) as string) || this.cache.get(ref);
            })
            .filter((entity): entity is IRelationshipEntity => Boolean(entity));
    }

    /**
     * Collect scalar leaf field names from a relationConfig subtree
     */
    private _collectScalarLeaves(relationConfig: IIncludeConfig): string[] {
        if (!relationConfig || !relationConfig.children) { return []; }

        const fields = new Set<string>();
        for (const [child, cfg] of Object.entries(relationConfig.children)) {
            if (cfg) {
                if (cfg.isLeaf) {
                    fields.add(child);
                } else if (cfg.children && Object.keys(cfg.children).length > 0) {
                    fields.add(child);
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

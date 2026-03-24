/**
 * Base class for Rally entities with relationship definitions
 */
import { LazyLink } from '../core/lazy-link.js';
import { getEntityTypeFromRef, normalizeEntityType } from '../core/ref-utils.js';
import type { RallyDataSource } from '../core/rally-datasource.js';

export interface IRallyEntityData {
    [key: string]: any;
    _ref?: string;
    ObjectID?: number | string;
    _type?: string;
}

export interface IRallyEntityContext {
    dataSource?: RallyDataSource;
}

export interface IFieldDefinition {
    type?: string;
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    values?: any[];
    enum?: any[];
    default?: any;
    readOnly?: boolean;
    nullable?: boolean;
    refType?: string;
    inverseRef?: boolean;
    isCollection?: boolean;
}

export interface IRelationDefinition {
    type?: 'belongsTo' | 'hasMany' | 'hasOne' | string;
    entity?: string;
    foreignKey?: string;
    inverseRef?: boolean;
    isCollection?: boolean;
}

function cloneEntityValue<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(item => cloneEntityValue(item)) as T;
    }

    if (value && typeof value === 'object') {
        const cloned: Record<string, any> = {};
        for (const [key, nestedValue] of Object.entries(value as Record<string, any>)) {
            cloned[key] = cloneEntityValue(nestedValue);
        }
        return cloned as T;
    }

    return value;
}

function entityValuesEqual(left: any, right: any): boolean {
    if (left === right) {
        return true;
    }

    if (left === null || right === null || left === undefined || right === undefined) {
        return left === right;
    }

    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
            return false;
        }

        for (let index = 0; index < left.length; index += 1) {
            if (!entityValuesEqual(left[index], right[index])) {
                return false;
            }
        }

        return true;
    }

    if (typeof left === 'object' && typeof right === 'object') {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);

        if (leftKeys.length !== rightKeys.length) {
            return false;
        }

        for (const key of leftKeys) {
            if (!Object.prototype.hasOwnProperty.call(right, key)) {
                return false;
            }

            if (!entityValuesEqual(left[key], right[key])) {
                return false;
            }
        }

        return true;
    }

    return false;
}

export class RallyEntity {
    /**
     * Entity type mapping to Rally API endpoint
     * @static
     */
    static entityType: string | null = null;

    /**
     * Field definitions for validation
     * @static
     */
    static fields: Record<string, IFieldDefinition> = {};

    /**
     * Relationship definitions
     * @static
     */
    static relations: Record<string, IRelationDefinition> = {};

    _data: IRallyEntityData;
    _context: IRallyEntityContext;
    _originalSnapshot: IRallyEntityData;
    _errors: string[];
    _loadedRelations: Set<string>;
    _relationCache: Map<string, any>;
    [key: string]: any;

    constructor(data: IRallyEntityData = {}, context: IRallyEntityContext = {}) {
        this._data = cloneEntityValue(data);
        this._context = context;
        this._applyFieldDefaults();
        // Create a snapshot for dirty checking
        this._originalSnapshot = cloneEntityValue(this._data);
        this._errors = [];
        this._loadedRelations = new Set();
        this._relationCache = new Map();

        this._setupRelationGetters();

        return new Proxy(this, {
            get(target: RallyEntity, prop: string | symbol, receiver: any) {
                if (prop in target || typeof prop === 'symbol') {
                    return Reflect.get(target, prop, receiver);
                }

                if (target._data && typeof prop === 'string' && prop in target._data) {
                    return target._data[prop];
                }

                return Reflect.get(target, prop, receiver);
            },
            set(target: RallyEntity, prop: string | symbol, value: any, receiver: any) {
                if (prop in target || typeof prop === 'symbol') {
                    return Reflect.set(target, prop, value, receiver);
                }
                if (target._data && typeof prop === 'string') {
                    target._data[prop] = value;
                    target._relationCache.delete(prop);
                    return true;
                }
                return Reflect.set(target, prop, value, receiver);
            }
        });
    }

    /**
     * Set up dynamic getters for defined relations
     * @private
     */
    _setupRelationGetters(): void {
        const relations = (this.constructor as typeof RallyEntity).relations || {};

        for (const [relationName, relationDefinition] of Object.entries(relations)) {
            // Only create getter if it doesn't already exist
            if (!Object.prototype.hasOwnProperty.call(this, relationName)) {
                Object.defineProperty(this, relationName, {
                    get() {
                        if (this._relationCache.has(relationName)) {
                            return this._relationCache.get(relationName);
                        }

                        const val = this._data[relationName];
                        // Detect if this is a lazy-loadable reference
                        if (val instanceof RallyEntity) {
                            return val;
                        }

                        if (val && val._ref && this._context && this._context.dataSource) {
                            const lazyLinkData = relationDefinition?.entity && !val._type
                                ? { ...val, _type: relationDefinition.entity }
                                : val;

                            return new LazyLink(lazyLinkData, this._context.dataSource);
                        }
                        return val;
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
    }

    /**
     * Validate entity data against the field definitions.
     */
    validate(): boolean {
        this._errors = [];
        const fields = (this.constructor as typeof RallyEntity).fields || {};
        const relations = (this.constructor as typeof RallyEntity).relations || {};

        for (const [fieldName, rules] of Object.entries(fields)) {
            const value = this._data[fieldName];
            this._validateField(fieldName, value, rules, relations[fieldName]);
        }

        return this._errors.length === 0;
    }

    /**
     * Return the current validation errors.
     */
    getErrors(): string[] {
        return [...this._errors];
    }

    /**
     * Validate a single field
     * @private
     */
    _validateField(name: string, value: any, rules: IFieldDefinition, relation?: IRelationDefinition): void {
        if (rules.required && (value === undefined || (value === null && !rules.nullable) || value === '')) {
            this._errors.push(`${name} is required`);
        }

        const allowedValues = Array.isArray(rules.enum)
            ? rules.enum
            : Array.isArray(rules.values)
                ? rules.values
                : undefined;

        if (value === null && rules.nullable) {
            return;
        }

        if (value !== undefined && value !== null) {
            if (rules.type === 'number') {
                if (isNaN(value)) {
                    this._errors.push(`${name} must be a number`);
                } else {
                    if (rules.min !== undefined && value < rules.min) {
                        this._errors.push(`${name} must be >= ${rules.min}`);
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        this._errors.push(`${name} must be <= ${rules.max}`);
                    }
                }
            }

            if (rules.type === 'integer') {
                if (!Number.isInteger(value)) {
                    this._errors.push(`${name} must be an integer`);
                } else {
                    if (rules.min !== undefined && value < rules.min) {
                        this._errors.push(`${name} must be >= ${rules.min}`);
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        this._errors.push(`${name} must be <= ${rules.max}`);
                    }
                }
            }

            if (rules.type === 'boolean' && typeof value !== 'boolean') {
                this._errors.push(`${name} must be a boolean`);
            }

            if (rules.type === 'string') {
                if (typeof value !== 'string') {
                    this._errors.push(`${name} must be a string`);
                } else {
                    if (rules.minLength !== undefined && value.length < rules.minLength) {
                        this._errors.push(`${name} must be at least ${rules.minLength} characters`);
                    }
                    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                        this._errors.push(`${name} must be at most ${rules.maxLength} characters`);
                    }
                }
            }

            if (rules.type === 'object') {
                if (typeof value !== 'object' || Array.isArray(value)) {
                    this._errors.push(`${name} must be an object`);
                }
            }

            if (rules.type === 'array' && !Array.isArray(value)) {
                this._errors.push(`${name} must be an array`);
            }

            if (allowedValues && !allowedValues.includes(value)) {
                this._errors.push(`${name} must be one of: ${allowedValues.join(', ')}`);
            }

            if (rules.type === 'ref' && !this._isRefLike(value)) {
                this._errors.push(`${name} must be a Rally reference`);
            }

            if (rules.type === 'collection' && !this._isCollectionLike(value)) {
                this._errors.push(`${name} must be a Rally collection or array`);
            }

            this._validateReferenceType(name, value, rules, relation);
        }
    }

    private _applyFieldDefaults(): void {
        const fields = (this.constructor as typeof RallyEntity).fields || {};

        for (const [fieldName, rules] of Object.entries(fields)) {
            if (this._data[fieldName] !== undefined || rules.default === undefined) {
                continue;
            }

            if (Array.isArray(rules.default)) {
                this._data[fieldName] = [...rules.default];
                continue;
            }

            if (rules.default && typeof rules.default === 'object') {
                this._data[fieldName] = { ...rules.default };
                continue;
            }

            this._data[fieldName] = rules.default;
        }
    }

    private _isRefLike(value: any): boolean {
        if (!value) {
            return false;
        }

        if (typeof value === 'string') {
            return getEntityTypeFromRef(value) !== null;
        }

        return typeof value === 'object' && (
            typeof value._ref === 'string'
            || value.ObjectID !== undefined
            || value._type !== undefined
        );
    }

    private _isCollectionLike(value: any): boolean {
        if (Array.isArray(value)) {
            return true;
        }

        return !!value
            && typeof value === 'object'
            && (
                typeof value._ref === 'string'
                || Array.isArray(value._tagsNameArray)
                || value.Count !== undefined
                || value.Results !== undefined
            );
    }

    private _validateReferenceType(name: string, value: any, rules: IFieldDefinition, relation?: IRelationDefinition): void {
        const expectedTypes = this._getExpectedReferenceTypes(rules, relation);
        if (expectedTypes.length === 0) {
            return;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                if (!this._matchesExpectedReferenceType(item, expectedTypes)) {
                    this._errors.push(`${name} must reference ${expectedTypes[0]}`);
                    return;
                }
            }

            return;
        }

        if (!this._matchesExpectedReferenceType(value, expectedTypes)) {
            this._errors.push(`${name} must reference ${expectedTypes[0]}`);
        }
    }

    private _getExpectedReferenceTypes(rules: IFieldDefinition, relation?: IRelationDefinition): string[] {
        const expectedTypes = new Set<string>();

        const fieldRefType = normalizeEntityType(rules.refType);
        if (fieldRefType) {
            expectedTypes.add(fieldRefType);
        }

        const relationEntityType = normalizeEntityType(relation?.entity);
        if (relationEntityType) {
            expectedTypes.add(relationEntityType);
        }

        return Array.from(expectedTypes);
    }

    private _matchesExpectedReferenceType(value: any, expectedTypes: string[]): boolean {
        const actualType = this._detectReferenceEntityType(value);
        if (!actualType) {
            return true;
        }

        return expectedTypes.some(expectedType => this._isCompatibleReferenceType(expectedType, actualType));
    }

    private _detectReferenceEntityType(value: any): string | null {
        if (!value) {
            return null;
        }

        if (typeof value === 'string') {
            return getEntityTypeFromRef(value);
        }

        const constructorEntityType = normalizeEntityType(value?.constructor?.entityType);
        if (constructorEntityType) {
            return constructorEntityType;
        }

        const rawEntityType = normalizeEntityType(value?._type);
        if (rawEntityType) {
            return rawEntityType;
        }

        if (typeof value?._ref === 'string') {
            return getEntityTypeFromRef(value._ref);
        }

        return null;
    }

    private _isCompatibleReferenceType(expectedType: string, actualType: string): boolean {
        if (expectedType === actualType) {
            return true;
        }

        const modelRegistry = this._context.dataSource?.getModelRegistry();
        if (!modelRegistry) {
            return false;
        }

        const expectedModel = modelRegistry[expectedType];
        const actualModel = modelRegistry[actualType];

        if (!expectedModel || !actualModel) {
            return false;
        }

        return actualModel === expectedModel || actualModel.prototype instanceof expectedModel;
    }

    /**
     * Return a cloned snapshot of the raw entity data.
     */
    toJSON(): IRallyEntityData {
        return cloneEntityValue(this._data);
    }

    /**
     * Return only the fields changed since the last clean snapshot.
     */
    getChanges(): Partial<IRallyEntityData> {
        const changes: Partial<IRallyEntityData> = {};
        const currentKeys = Object.keys(this._data);
        const originalKeys = Object.keys(this._originalSnapshot);
        const allKeys = new Set([...currentKeys, ...originalKeys]);

        for (const key of allKeys) {
            const currentValue = this._data[key];
            const originalValue = this._originalSnapshot[key];

            if (!entityValuesEqual(currentValue, originalValue)) {
                changes[key] = cloneEntityValue(currentValue);
            }
        }
        return changes;
    }

    /**
     * Mark current state as clean (update snapshot)
     */
    commit(): void {
        this._originalSnapshot = cloneEntityValue(this._data);
    }

    /**
     * Get a custom field value
     * Custom fields in Rally typically start with 'c_'
     */
    getCustomField<T = any>(fieldName: string): T | undefined {
        return this._data[fieldName] as T;
    }

    /**
     * Set a custom field value.
     */
    setCustomField<T = any>(fieldName: string, value: T): void {
        this._data[fieldName] = value;
    }

    /**
     * Check whether a custom field currently has a value.
     */
    hasCustomField(fieldName: string): boolean {
        const value = this._data[fieldName];
        return value !== undefined && value !== null;
    }

    /**
     * List all custom field names that start with 'c_'.
     */
    listCustomFields(): string[] {
        return Object.keys(this._data).filter(key => key.startsWith('c_'));
    }

    /**
     * Return all custom fields and their current values.
     */
    getCustomFields(): Record<string, any> {
        const customFields: Record<string, any> = {};
        for (const key of this.listCustomFields()) {
            customFields[key] = this._data[key];
        }
        return customFields;
    }

    /**
     * Set multiple custom fields at once.
     */
    setCustomFields(fields: Record<string, any>): void {
        for (const [key, value] of Object.entries(fields)) {
            this._data[key] = value;
        }
    }
}

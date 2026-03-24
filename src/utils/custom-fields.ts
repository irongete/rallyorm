import { RallyEntity, IFieldDefinition } from '../models/base-entity.js';

/**
 * Create a derived model class that merges custom field definitions into an existing model.
 *
 * @param BaseModel Existing Rally model class to extend.
 * @param customFields Map of Rally custom field definitions keyed by field name.
 * @returns A derived model class that preserves the original entity type and relations.
 */
export function extendModel(
    BaseModel: typeof RallyEntity,
    customFields: Record<string, IFieldDefinition>
): typeof RallyEntity {
    const ExtendedClass: any = class extends (BaseModel as any) {
        constructor(...args: any[]) {
            super(...args);
        }
    };

    ExtendedClass.fields = {
        ...(BaseModel.fields || {}),
        ...customFields
    };

    ExtendedClass.entityType = BaseModel.entityType;
    ExtendedClass.relations = BaseModel.relations || {};

    return ExtendedClass;
}

/**
 * Validate that a custom field name follows Rally naming conventions.
 *
 * @param fieldName Candidate field name to validate.
 * @returns `true` when the field name starts with `c_` and uses a valid identifier shape.
 */
export function isValidCustomFieldName(fieldName: string): boolean {
    return /^c_[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldName);
}

/**
 * Create a typed proxy accessor for an entity's custom fields.
 *
 * @param entity Entity whose custom fields should be accessed through the proxy.
 * @returns A proxy that maps property reads and writes to custom field accessors.
 */
export function createCustomFieldAccessor<T extends Record<string, any>>(
    entity: RallyEntity
): T {
    return new Proxy({} as T, {
        get(_target, prop: string) {
            return entity.getCustomField(prop);
        },
        set(_target, prop: string, value: any) {
            entity.setCustomField(prop, value);
            return true;
        }
    });
}

export default {
    extendModel,
    isValidCustomFieldName,
    createCustomFieldAccessor
};

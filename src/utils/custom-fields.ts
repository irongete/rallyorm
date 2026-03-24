import { RallyEntity, IFieldDefinition } from '../models/base-entity.js';

/**
 * Extend an existing Rally model with custom fields.
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
 * Validate that a custom field name follows Rally conventions.
 */
export function isValidCustomFieldName(fieldName: string): boolean {
    return /^c_[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldName);
}

/**
 * Create a typed accessor for an entity's custom fields.
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

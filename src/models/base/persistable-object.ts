import { RallyEntity, type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';

/**
 * Base class for Rally records with persistence metadata.
 */
export abstract class PersistableObject extends RallyEntity {
    static entityType = 'persistableobject';
    static isAbstract = true;

    static fields: Record<string, IFieldDefinition> = {
        // Identity
        ObjectID: {
            type: 'number'
        },
        ObjectUUID: {
            type: 'string'
        },
        _ref: {
            type: 'string'
        },
        _refObjectUUID: {
            type: 'string'
        },
        _type: {
            type: 'string'
        },

        // Timestamps
        CreationDate: {
            type: 'string'
        },
        _CreatedAt: {
            type: 'string'
        },
    };

    static relations: Record<string, IRelationDefinition> = {};
}

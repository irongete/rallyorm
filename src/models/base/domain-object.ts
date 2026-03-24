import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { PersistableObject } from './persistable-object.js';

/**
 * Base class for subscription-scoped objects.
 *
 * Adds subscription ownership metadata to persistable Rally records that exist
 * at the tenant level.
 */
export abstract class DomainObject extends PersistableObject {
    static entityType = 'domainobject';
    static isAbstract = true;

    static fields: Record<string, IFieldDefinition> = {
        ...PersistableObject.fields,

        Subscription: {
            type: 'object'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...PersistableObject.relations,

        Subscription: {
            type: 'belongsTo',
            entity: 'subscription',
            foreignKey: 'Subscription'
        }
    };
}

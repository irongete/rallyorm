import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { DomainObject } from './domain-object.js';

/**
 * Base class for workspace-scoped objects.
 */
export abstract class WorkspaceDomainObject extends DomainObject {
    static entityType = 'workspacedomainobject';
    static isAbstract = true;

    static fields: Record<string, IFieldDefinition> = {
        ...DomainObject.fields,

        Workspace: {
            type: 'object'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...DomainObject.relations,

        Workspace: {
            type: 'belongsTo',
            entity: 'workspace',
            foreignKey: 'Workspace'
        }
    };
}

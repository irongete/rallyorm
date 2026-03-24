import { RallyEntity } from '../base-entity.js';

/**
 * WorkspacePermission
 *
 * User permission level within a specific workspace.
 */
export class WorkspacePermission extends RallyEntity {
    static entityType = 'workspacepermission';

    static fields = {
        Name: {
            type: 'string'
        },
        Role: {
            type: 'string'
        },
        User: {
            type: 'object'
        },
        Workspace: {
            type: 'object'
        },
        CreationDate: {
            type: 'string'
        },
        ObjectID: {
            type: 'number'
        },
        _ref: {
            type: 'string'
        },
        _type: {
            type: 'string'
        }
    };

    static relations = {
        User: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'User'
        },
        Workspace: {
            type: 'belongsTo',
            entity: 'workspace',
            foreignKey: 'Workspace'
        }
    };
}

export default WorkspacePermission;

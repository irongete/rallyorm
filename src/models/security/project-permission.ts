import { RallyEntity } from '../base-entity.js';

/**
 * Project-permission entity.
 *
 * Represents a user's permission assignment within a specific Rally project.
 */
export class ProjectPermission extends RallyEntity {
    static entityType = 'projectpermission';

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
        Project: {
            type: 'object'
        },
        ProjectState: {
            type: 'string'
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
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        }
    };
}

export default ProjectPermission;

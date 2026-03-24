import { RallyEntity } from '../base-entity.js';

/**
 * Preference entity.
 *
 * Represents a stored preference or setting associated with a Rally user,
 * project, or application context.
 */
export class Preference extends RallyEntity {
    static entityType = 'preference';

    static fields = {
        Name: {
            type: 'string',
            required: true
        },
        Value: {
            type: 'string'
        },
        Type: {
            type: 'string'
        },
        AppId: {
            type: 'string'
        },

        // Metadata
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
        },

        User: {
            type: 'object'
        },
        Project: {
            type: 'object'
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

export default Preference;

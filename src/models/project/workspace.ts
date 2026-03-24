import { RallyEntity } from '../base-entity.js';

/**
 * Workspace entity.
 *
 * Represents a top-level Rally workspace that scopes projects, users, and
 * related planning data.
 */
export class Workspace extends RallyEntity {
    static entityType = 'workspace';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        Description: {
            type: 'string'
        },
        Notes: {
            type: 'string'
        },

        // Hierarchy
        Children: {
            type: 'array'
        },
        Parent: {
            type: 'object'
        },

        // Organization
        Projects: {
            type: 'array'
        },
        Owner: {
            type: 'object'
        },

        // State
        State: {
            type: 'enum',
            values: ['Open', 'Closed']
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

        // Version control
        RevisionHistory: {
            type: 'object'
        }
    };

    static relations = {
        Owner: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'Owner'
        },
        Parent: {
            type: 'belongsTo',
            entity: 'workspace',
            foreignKey: 'Parent'
        },
        Children: {
            type: 'hasMany',
            entity: 'workspace',
            foreignKey: 'Parent',
            inverseRef: true
        },
        Projects: {
            type: 'hasMany',
            entity: 'project',
            foreignKey: 'Workspace',
            inverseRef: true
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'revisionhistory',
            foreignKey: 'RevisionHistory'
        }
    };
}

export default Workspace;

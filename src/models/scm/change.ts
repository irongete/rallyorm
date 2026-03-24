import { RallyEntity } from '../base-entity.js';

/**
 * Change entity.
 *
 * Represents a source-control file change associated with Rally SCM and audit
 * integrations.
 */
export class Change extends RallyEntity {
    static entityType = 'change';

    static fields = {
        // File Information
        PathAndFilename: {
            type: 'string'
        },
        Extension: {
            type: 'string'
        },

        // Change Type
        Action: {
            type: 'enum',
            values: ['Added', 'Modified', 'Deleted', 'Renamed']
        },

        // Version Info
        Base: {
            type: 'string'
        },

        // Source Control URI
        Uri: {
            type: 'string'
        },

        // Relationships
        Changeset: {
            type: 'object'
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
        }
    };

    static relations = {
        Changeset: {
            type: 'belongsTo',
            entity: 'changeset',
            foreignKey: 'Changeset'
        }
    };
}

export default Change;

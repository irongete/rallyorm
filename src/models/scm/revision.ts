import { RallyEntity } from '../base-entity.js';

/**
 * Revision
 *
 * Single revision entry in an artifact's audit history.
 * Tracks the change history and audit trail for Rally artifacts.
 */
export class Revision extends RallyEntity {
    static entityType = 'revision';

    static fields = {
        // Revision Information
        RevisionNumber: {
            type: 'number'
            // Sequential revision number
        },
        Description: {
            type: 'string'
            // Description of changes made
        },

        // User who made the change
        User: {
            type: 'object'
            // Reference to User
        },

        // Parent container
        RevisionHistory: {
            type: 'object'
            // Reference to RevisionHistory
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
        User: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'User'
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'revisionhistory',
            foreignKey: 'RevisionHistory'
        }
    };
}

export default Revision;

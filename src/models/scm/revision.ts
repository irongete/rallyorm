import { RallyEntity } from '../base-entity.js';

/**
 * Revision entity.
 *
 * Represents a single revision entry in the audit history of a Rally artifact.
 */
export class Revision extends RallyEntity {
    static entityType = 'revision';

    static fields = {
        // Revision Information
        /**
         * Sequential revision number for the artifact history entry.
         */
        RevisionNumber: {
            type: 'number'
        },
        /**
         * Description of the change captured by this revision.
         */
        Description: {
            type: 'string'
        },

        // User who made the change
        /**
         * User who created the revision entry.
         */
        User: {
            type: 'object'
        },

        // Parent container
        /**
         * Revision-history container that owns this revision.
         */
        RevisionHistory: {
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

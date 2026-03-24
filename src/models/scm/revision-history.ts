import { RallyEntity } from '../base-entity.js';

/**
 * Revision-history entity.
 *
 * Represents the revision-history container that groups every revision recorded
 * for a single Rally artifact.
 */
export class RevisionHistory extends RallyEntity {
    static entityType = 'revisionhistory';

    static fields = {
        // Revisions Collection
        Revisions: {
            type: 'array'
            // Array of Revision references
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
        Revisions: {
            type: 'hasMany',
            entity: 'revision',
            foreignKey: 'RevisionHistory',
            inverseRef: true
        }
    };
}

export default RevisionHistory;

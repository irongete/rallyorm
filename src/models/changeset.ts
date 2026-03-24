import { RallyEntity } from './base-entity.js';

/**
 * Changeset
 * Source control changeset or commit.
 */
export class Changeset extends RallyEntity {
    static entityType = 'changeset';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            maxLength: 256
        },
        Revision: {
            type: 'string',
            required: true
        },
        Message: {
            type: 'string'
        },
        Uri: {
            type: 'string'
        },

        // Author and timing
        Author: {
            type: 'string'
        },
        CommitTimestamp: {
            type: 'string'
        },

        // Branch info
        Branch: {
            type: 'string'
        }
    };

    static relations = {
        // Relationships
        SCMRepository: {
            type: 'belongsTo',
            entity: 'scmrepository',
            foreignKey: 'SCMRepository'
        },

        // Collections (many-to-many)
        Artifacts: {
            type: 'hasMany',
            entity: 'object',
            foreignKey: 'Changesets',
            isCollection: true
        },
        Builds: {
            type: 'hasMany',
            entity: 'build',
            foreignKey: 'Changesets',
            isCollection: true
        }
    };
}

export default Changeset;

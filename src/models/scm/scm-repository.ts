import { RallyEntity } from '../base-entity.js';

/**
 * Scm-repository entity.
 *
 * Represents the source-control repository configuration that links Rally to an
 * external SCM system.
 */
export class SCMRepository extends RallyEntity {
    static entityType = 'scmrepository';

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

        // Repository Configuration
        SCMType: {
            type: 'enum',
            values: ['Git', 'Subversion', 'Perforce', 'TFS', 'Other']
        },
        /**
         * Repository URL or URI exposed to Rally.
         */
        Uri: {
            type: 'string'
        },

        // Associated Projects
        /**
         * Projects associated with this source-control repository.
         */
        Projects: {
            type: 'array'
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

        // Workspace
        Workspace: {
            type: 'object'
        }
    };

    static relations = {
        Workspace: {
            type: 'belongsTo',
            entity: 'workspace',
            foreignKey: 'Workspace'
        },
        Projects: {
            type: 'hasMany',
            entity: 'project',
            foreignKey: 'SCMRepositories',
            inverseRef: true
        }
    };
}

export default SCMRepository;

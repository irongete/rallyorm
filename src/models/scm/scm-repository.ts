import { RallyEntity } from '../base-entity.js';

/**
 * SCMRepository
 *
 * Links Rally to Git, SVN, or other SCM systems.
 * Source control repository configuration linked to Rally.
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
        Uri: {
            type: 'string'
            // Repository URL/URI
        },

        // Associated Projects
        Projects: {
            type: 'array'
            // Projects using this repository
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

import { RallyEntity } from '../base-entity.js';

/**
 * Pull-request entity.
 *
 * Represents a pull request from an external SCM system that is linked back to
 * Rally artifacts.
 */
export class PullRequest extends RallyEntity {
    static entityType = 'pullrequest';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            maxLength: 256
        },
        Description: {
            type: 'string'
        },

        // External PR Reference
        ExternalID: {
            type: 'string'
        },
        ExternalFormattedId: {
            type: 'string'
        },

        // Linked Rally Artifact
        Artifact: {
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
        },

        // Project
        Project: {
            type: 'object'
        },

        // Type Definition
        TypeDefinition: {
            type: 'object'
        }
    };

    static relations = {
        Artifact: {
            type: 'belongsTo',
            entity: 'artifact',
            foreignKey: 'Artifact'
        },
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },
        TypeDefinition: {
            type: 'belongsTo',
            entity: 'typedefinition',
            foreignKey: 'TypeDefinition'
        }
    };
}

export default PullRequest;

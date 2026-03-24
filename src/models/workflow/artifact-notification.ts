import { RallyEntity } from '../base-entity.js';

/**
 * Artifact-notification entity.
 *
 * Represents the notification or alert configuration applied to Rally
 * artifacts.
 */
export class ArtifactNotification extends RallyEntity {
    static entityType = 'artifactnotification';

    static fields = {
        Name: {
            type: 'string'
        },
        Description: {
            type: 'string'
        },
        ClassName: {
            type: 'string'
        },
        ID: {
            type: 'string'
        },
        IDPrefix: {
            type: 'string'
        },
        IDSuffix: {
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

        Project: {
            type: 'object'
        }
    };

    static relations = {
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        }
    };
}

export default ArtifactNotification;

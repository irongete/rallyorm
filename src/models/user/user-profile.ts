import { RallyEntity } from '../base-entity.js';

/**
 * UserProfile
 *
 * User profile settings and preferences for Rally users.
 */
export class UserProfile extends RallyEntity {
    static entityType = 'userprofile';

    static fields = {
        // Display preferences
        DateFormat: {
            type: 'string'
        },
        DateTimeFormat: {
            type: 'string'
        },
        Language: {
            type: 'string'
        },
        Locale: {
            type: 'string'
        },
        TimeZone: {
            type: 'string'
        },

        // UI preferences
        DefaultProject: {
            type: 'object'
        },
        DefaultDetailPageToViewingMode: {
            type: 'boolean'
        },

        // Notification settings
        EmailNotificationEnabled: {
            type: 'boolean'
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
        DefaultProject: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'DefaultProject'
        }
    };
}

export default UserProfile;

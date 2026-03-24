import { RallyEntity } from '../base-entity.js';

/**
 * User-notification-filter entity.
 *
 * Represents the filter configuration that controls which notifications a user
 * receives from Rally, helping tailor alert volume and relevance.
 */
export class UserNotificationFilter extends RallyEntity {
    static entityType = 'usernotificationfilter';
    static fields = {
        Name: { type: 'string' },
        User: { type: 'object' },
        _ref: { type: 'string' }
    };
    static relations = {
        User: { type: 'belongsTo', entity: 'user', foreignKey: 'User' }
    };
}

export default UserNotificationFilter;

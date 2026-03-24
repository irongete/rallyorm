import { RallyEntity } from '../base-entity.js';

/**
 * UserNotificationFilter
 *
 * Filter configuration used for user notifications.
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

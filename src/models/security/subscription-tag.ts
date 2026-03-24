import { RallyEntity } from '../base-entity.js';

/**
 * Subscription-tag entity.
 *
 * Represents a tag definition managed at the Rally subscription level for reuse
 * across broader tenant-wide contexts.
 */
export class SubscriptionTag extends RallyEntity {
    static entityType = 'subscriptiontag';

    static fields = {
        Name: {
            type: 'string'
        },
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

    static relations = {};
}

export default SubscriptionTag;

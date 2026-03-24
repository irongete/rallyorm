import { RallyEntity } from '../base-entity.js';

/**
 * SubscriptionTag
 *
 * Tag defined at the subscription level.
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

import { RallyEntity } from '../base-entity.js';

/**
 * Investment
 *
 * Strategic investment category or funding stream.
 */
export class Investment extends RallyEntity {
    static entityType = 'investment';

    static fields = {
        Name: { type: 'string' },
        Description: { type: 'string' },
        Category: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default Investment;

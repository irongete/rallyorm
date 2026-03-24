import { RallyEntity } from '../base-entity.js';

/**
 * Investment entity.
 *
 * Represents a strategic investment category or funding stream used in Rally
 * planning data.
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

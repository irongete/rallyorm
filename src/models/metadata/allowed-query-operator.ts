import { RallyEntity } from '../base-entity.js';

/**
 * AllowedQueryOperator
 *
 * Query operator allowed for a specific attribute.
 */
export class AllowedQueryOperator extends RallyEntity {
    static entityType = 'allowedqueryoperator';

    static fields = {
        OperatorName: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default AllowedQueryOperator;

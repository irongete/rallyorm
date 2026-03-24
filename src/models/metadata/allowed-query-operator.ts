import { RallyEntity } from '../base-entity.js';

/**
 * Allowed-query-operator entity.
 *
 * Represents a query operator that Rally allows for a specific attribute
 * definition.
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

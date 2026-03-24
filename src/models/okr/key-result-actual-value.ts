import { RallyEntity } from '../base-entity.js';

/**
 * Key-result-actual-value entity.
 *
 * Represents a recorded actual value for a key result at a specific point in
 * time so progress can be tracked historically against targets.
 */
export class KeyResultActualValue extends RallyEntity {
    static entityType = 'keyresultactualvalue';
    static fields = {
        Value: { type: 'number' },
        Date: { type: 'string' },
        KeyResult: { type: 'object' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {
        KeyResult: { type: 'belongsTo', entity: 'keyresult', foreignKey: 'KeyResult' }
    };
}

export default KeyResultActualValue;

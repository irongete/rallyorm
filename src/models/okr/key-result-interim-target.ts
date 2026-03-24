import { RallyEntity } from '../base-entity.js';

/**
 * Key-result-interim-target entity.
 *
 * Represents an interim target value used to measure progress toward a key
 * result before the final target date is reached.
 */
export class KeyResultInterimTarget extends RallyEntity {
    static entityType = 'keyresultinterimtarget';
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

export default KeyResultInterimTarget;

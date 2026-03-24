import { RallyEntity } from '../base-entity.js';

/**
 * KeyResultInterimTarget
 *
 * Interim target value used to track key result progress.
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

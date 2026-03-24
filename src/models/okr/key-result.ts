import { RallyEntity } from '../base-entity.js';

/**
 * Key-result entity.
 *
 * Represents a measurable outcome linked to an objective in Rally's OKR data
 * model.
 */
export class KeyResult extends RallyEntity {
    static entityType = 'keyresult';

    static fields = {
        Name: { type: 'string', required: true },
        Description: { type: 'string' },

        Objective: { type: 'object' },

        TargetValue: { type: 'number' },
        ActualValue: { type: 'number' },
        ConfidenceScore: { type: 'number' },

        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };

    static relations = {
        Objective: {
            type: 'belongsTo',
            entity: 'objective',
            foreignKey: 'Objective'
        }
    };
}

export default KeyResult;

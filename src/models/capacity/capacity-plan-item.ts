// Simplified capacity planning supporting models
import { RallyEntity } from '../base-entity.js';

/**
 * CapacityPlanItem
 *
 * Individual item or requirement within a capacity plan.
 */
export class CapacityPlanItem extends RallyEntity {
    static entityType = 'capacityplanitem';
    static fields = {
        CapacityPlan: { type: 'object' },
        Assignments: { type: 'array' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {};
}

export default CapacityPlanItem;

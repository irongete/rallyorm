// Simplified capacity planning supporting models
import { RallyEntity } from '../base-entity.js';

/**
 * Capacity-plan-item entity.
 *
 * Represents an individual work item, requirement, or planning element tracked
 * within a Rally capacity plan.
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

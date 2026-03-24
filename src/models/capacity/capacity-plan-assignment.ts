import { RallyEntity } from '../base-entity.js';

/**
 * CapacityPlanAssignment
 *
 * Resource or allocation assignment for a capacity plan item.
 */
export class CapacityPlanAssignment extends RallyEntity {
    static entityType = 'capacityplanassignment';
    static fields = {
        AllocationCount: { type: 'number' },
        AllocationPoints: { type: 'number' },
        CapacityPlanItem: { type: 'object' },
        CapacityPlanProject: { type: 'object' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {};
}

export default CapacityPlanAssignment;

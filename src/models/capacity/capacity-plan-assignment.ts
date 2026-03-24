import { RallyEntity } from '../base-entity.js';

/**
 * Capacity-plan-assignment entity.
 *
 * Represents a resource allocation or assignment attached to a Rally capacity
 * plan item.
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

import { RallyEntity } from '../base-entity.js';

/**
 * Capacity-plan-project entity.
 *
 * Represents the project-level association and planned capacity metrics stored
 * within a Rally capacity plan.
 */
export class CapacityPlanProject extends RallyEntity {
    static entityType = 'capacityplanproject';
    static fields = {
        CapacityPlan: { type: 'object' },
        Project: { type: 'object' },
        PlannedCapacityCount: { type: 'number' },
        PlannedCapacityPoints: { type: 'number' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {
        Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
    };
}

export default CapacityPlanProject;

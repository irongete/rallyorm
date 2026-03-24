import { RallyEntity } from '../base-entity.js';

/**
 * User-iteration-capacity entity.
 *
 * Represents the capacity allocation and load data for a specific user within a
 * Rally iteration.
 */
export class UserIterationCapacity extends RallyEntity {
    static entityType = 'useriterationcapacity';
    static fields = {
        Capacity: { type: 'number' },
        Load: { type: 'number' },
        User: { type: 'object' },
        Iteration: { type: 'object' },
        Project: { type: 'object' },
        TaskEstimates: { type: 'number' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {
        User: { type: 'belongsTo', entity: 'user', foreignKey: 'User' },
        Iteration: { type: 'belongsTo', entity: 'iteration', foreignKey: 'Iteration' },
        Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
    };
}

export default UserIterationCapacity;

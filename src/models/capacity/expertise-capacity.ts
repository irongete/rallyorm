import { RallyEntity } from '../base-entity.js';

/**
 * Expertise-capacity entity.
 *
 * Represents the available capacity for a specific expertise within a Rally
 * project or planning scope.
 */
export class ExpertiseCapacity extends RallyEntity {
    static entityType = 'expertisecapacity';
    static fields = {
        Name: { type: 'string' },
        Amount: { type: 'number' },
        Project: { type: 'object' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {
        Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
    };
}

export default ExpertiseCapacity;

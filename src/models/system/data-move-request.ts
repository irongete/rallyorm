import { RallyEntity } from '../base-entity.js';

/**
 * DataMoveRequest
 *
 * System request to move data between Rally containers.
 */
export class DataMoveRequest extends RallyEntity {
    static entityType = 'datamoverequest';
    static fields = {
        Project: { type: 'object' },
        State: { type: 'string' },
        _ref: { type: 'string' }
    };
    static relations = {
        Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
    };
}

export default DataMoveRequest;

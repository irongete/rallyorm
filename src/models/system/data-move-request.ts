import { RallyEntity } from '../base-entity.js';

/**
 * Data-move-request entity.
 *
 * Represents a system-level request to move Rally data between supported
 * containers or scopes.
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

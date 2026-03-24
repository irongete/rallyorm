import { RallyEntity } from '../base-entity.js';

/**
 * RecycleBinEntry
 *
 * Deleted item that temporarily resides in the recycle bin
 * before permanent deletion.
 */
export class RecycleBinEntry extends RallyEntity {
    static entityType = 'recyclebinentry';

    static fields = {
        DeletionDate: { type: 'string' },
        DeletedBy: { type: 'object' },
        Name: { type: 'string' },
        Type: { type: 'object' },
        ID: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {
        DeletedBy: { type: 'belongsTo', entity: 'user', foreignKey: 'DeletedBy' },
        Type: { type: 'belongsTo', entity: 'typedefinition', foreignKey: 'Type' }
    };
}

export default RecycleBinEntry;

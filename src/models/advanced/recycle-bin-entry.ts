import { RallyEntity } from '../base-entity.js';

/**
 * Recycle-bin entry entity.
 *
 * Represents an item that has been deleted in Rally and is temporarily retained
 * before permanent removal.
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

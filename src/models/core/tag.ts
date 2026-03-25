import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Tag
 */
export class Tag extends RallyEntity {
    static override readonly entityType = 'tag';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        UsageCount: { type: 'integer', readOnly: true },
        Archived: { type: 'boolean' },
        Name: { type: 'string', required: true, maxLength: 32 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        Workspace: {
            type: 'belongsTo',
            entity: 'Workspace',
            isCollection: false,
            foreignKey: 'Workspace'
        },
        Subscription: {
            type: 'belongsTo',
            entity: 'Subscription',
            isCollection: false,
            foreignKey: 'Subscription',
            readOnly: true
        },
    };
}

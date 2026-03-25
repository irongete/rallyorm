import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Release
 */
export class Release extends RallyEntity {
    static override readonly entityType = 'release';

    static override readonly fields = {
        LastUpdateDate: { type: 'date', required: true, readOnly: true },
        ReleaseBacklogItemsCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        Accepted: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        PlanEstimate: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        TaskActualTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        TaskRemainingTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        TaskEstimateTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        PlannedVelocity: { type: 'number' },
        ReleaseStartDate: { type: 'date', required: true },
        Notes: { type: 'string', maxLength: 32768, sortable: false },
        ChildrenPlannedVelocity: { type: 'number', readOnly: true, sortable: false },
        ReleaseDate: { type: 'date', required: true },
        GrossEstimateConversionRatio: { type: 'number' },
        Version: { type: 'string', maxLength: 256 },
        State: { type: 'string', required: true, maxLength: 128, enum: ['Planning', 'Active', 'Accepted'] },
        Theme: { type: 'string', maxLength: 32768, sortable: false },
        Name: { type: 'string', required: true, maxLength: 256 },
        CascadedToChildren: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        SyncedWithParent: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        WorkProducts: {
            type: 'hasMany',
            entity: 'Artifact',
            isCollection: true
        },
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
        Project: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'Project',
            readOnly: true
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'RevisionHistory',
            isCollection: false,
            foreignKey: 'RevisionHistory',
            readOnly: true
        },
    };
}

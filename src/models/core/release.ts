import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Release
 */
export class Release extends RallyEntity {

    declare CommonKey?: string | null;
    declare LastUpdateDate?: string | Date;
    declare ReleaseBacklogItemsCount?: number | null;
    declare Accepted?: number | null;
    declare PlanEstimate?: number | null;
    declare ObjectUUID?: string;
    declare TaskActualTotal?: number | null;
    declare TaskRemainingTotal?: number | null;
    declare TaskEstimateTotal?: number | null;
    declare PlannedVelocity?: number | null;
    declare ReleaseStartDate?: string | Date;
    declare Notes?: string;
    declare ChildrenPlannedVelocity?: number | null;
    declare ReleaseDate?: string | Date;
    declare GrossEstimateConversionRatio?: number | null;
    declare Version?: string | null;
    declare State?: "Planning" | "Active" | "Accepted" | (string & {});
    declare Theme?: string;
    declare Name?: string;
    declare CascadedToChildren?: boolean;
    declare SyncedWithParent?: boolean;
    declare VersionId?: string | null;
    declare CreationDate?: string | Date;
    declare ObjectID?: number;
    declare WorkProducts?: any[];
    declare Workspace?: any;
    declare Subscription?: any;
    declare Project?: any;
    declare RevisionHistory?: any;

    static override readonly entityType = 'release';

    static override readonly fields = {
        CommonKey: { type: 'string', readOnly: true, maxLength: 32, sortable: false },
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

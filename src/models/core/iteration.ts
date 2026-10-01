import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Iteration
 */
export class Iteration extends RallyEntity {

    declare CommonKey?: string | null;
    declare LastUpdateDate?: string | Date;
    declare PlanEstimate?: number | null;
    declare ObjectUUID?: string;
    declare ColorAggregation?: string | null;
    declare UnplannedWorkItemCount?: number | null;
    declare TaskActualTotal?: number | null;
    declare TaskRemainingTotal?: number | null;
    declare TaskEstimateTotal?: number | null;
    declare PlannedVelocity?: number | null;
    declare ChildrenPlannedVelocity?: number | null;
    declare EndDate?: string | Date;
    declare StartDate?: string | Date;
    declare State?: "Planning" | "Committed" | "Accepted" | (string & {});
    declare Notes?: string;
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
    declare UserIterationCapacities?: any[];
    declare Project?: any;
    declare RevisionHistory?: any;

    static override readonly entityType = 'iteration';

    static override readonly fields = {
        CommonKey: { type: 'string', readOnly: true, maxLength: 32, sortable: false },
        LastUpdateDate: { type: 'date', required: true, readOnly: true },
        PlanEstimate: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        ColorAggregation: { type: 'string', readOnly: true, filterable: false, sortable: false },
        UnplannedWorkItemCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        TaskActualTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        TaskRemainingTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        TaskEstimateTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        PlannedVelocity: { type: 'number', maxFractionalDigits: 3 },
        ChildrenPlannedVelocity: { type: 'number', readOnly: true, maxFractionalDigits: 3, filterable: false, sortable: false },
        EndDate: { type: 'date', required: true },
        StartDate: { type: 'date', required: true },
        State: { type: 'string', required: true, maxLength: 128, enum: ['Planning', 'Committed', 'Accepted'] },
        Notes: { type: 'string', maxLength: 32768, sortable: false },
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
            entity: 'SchedulableArtifact',
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
        UserIterationCapacities: {
            type: 'hasMany',
            entity: 'UserIterationCapacity',
            isCollection: true,
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

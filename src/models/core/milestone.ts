import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Milestone
 */
export class Milestone extends RallyEntity {

    declare DCLastUpdateDate?: string | Date | null;
    declare DCWeakestProjectRisk?: string | null;
    declare DCWeakestProjectScore?: number | null;
    declare DCPercentLowRiskRemaining?: number | null;
    declare DCProduct?: number | null;
    declare DCWeightedAverageRisk?: string | null;
    declare DCWeightedAverageScore?: number | null;
    declare StartDate?: string | Date | null;
    declare IssueCount?: number | null;
    declare PercentDoneByWorkItemPoints?: number | null;
    declare PercentDoneByWorkItemCount?: number | null;
    declare TotalWorkItemPoints?: number | null;
    declare TotalWorkItemCount?: number | null;
    declare AcceptedWorkItemPoints?: number | null;
    declare AcceptedWorkItemCount?: number | null;
    declare WorkspaceScoped?: boolean;
    declare ClosedProjectCount?: number | null;
    declare Description?: string;
    declare Recycled?: boolean;
    declare TotalProjectCount?: number | null;
    declare LastUpdateDate?: string | Date | null;
    declare Notes?: string;
    declare DisplayColor?: string | null;
    declare TotalArtifactCount?: number | null;
    declare FormattedID?: string;
    declare TargetDate?: string | Date | null;
    declare Name?: string;
    declare ObjectUUID?: string;
    declare VersionId?: string | null;
    declare CreationDate?: string | Date;
    declare ObjectID?: number;
    declare RevisionHistory?: any;
    declare TargetProject?: any;
    declare Projects?: any[];
    declare Artifacts?: any[];
    declare Workspace?: any;
    declare Subscription?: any;

    static override readonly entityType = 'milestone';

    static override readonly fields = {
        DCLastUpdateDate: { type: 'date', readOnly: true },
        DCWeakestProjectRisk: { type: 'string', readOnly: true },
        DCWeakestProjectScore: { type: 'number', readOnly: true },
        DCPercentLowRiskRemaining: { type: 'number', readOnly: true },
        DCProduct: { type: 'number', readOnly: true },
        DCWeightedAverageRisk: { type: 'string', readOnly: true },
        DCWeightedAverageScore: { type: 'number', readOnly: true },
        StartDate: { type: 'date' },
        IssueCount: { type: 'integer', readOnly: true },
        PercentDoneByWorkItemPoints: { type: 'number', readOnly: true },
        PercentDoneByWorkItemCount: { type: 'number', readOnly: true },
        TotalWorkItemPoints: { type: 'number', readOnly: true },
        TotalWorkItemCount: { type: 'integer', readOnly: true },
        AcceptedWorkItemPoints: { type: 'number', readOnly: true },
        AcceptedWorkItemCount: { type: 'integer', readOnly: true },
        WorkspaceScoped: { type: 'boolean' },
        ClosedProjectCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        Description: { type: 'string', maxLength: 32768 },
        Recycled: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        TotalProjectCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        LastUpdateDate: { type: 'date', readOnly: true },
        Notes: { type: 'string', maxLength: 32768 },
        DisplayColor: { type: 'string', maxLength: 128 },
        TotalArtifactCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        FormattedID: { type: 'string', required: true, readOnly: true, maxLength: 10 },
        TargetDate: { type: 'date' },
        Name: { type: 'string', required: true, maxLength: 80 },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'RevisionHistory',
            isCollection: false,
            foreignKey: 'RevisionHistory'
        },
        TargetProject: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'TargetProject'
        },
        Projects: {
            type: 'hasMany',
            entity: 'Project',
            isCollection: true
        },
        Artifacts: {
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
    };
}

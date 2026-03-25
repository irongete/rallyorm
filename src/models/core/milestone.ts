import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Milestone
 */
export class Milestone extends RallyEntity {
    static override readonly entityType = 'milestone';

    static override readonly fields = {
        IssueCount: { type: 'integer', readOnly: true, sortable: false },
        PercentDoneByWorkItemPoints: { type: 'number', readOnly: true, sortable: false },
        PercentDoneByWorkItemCount: { type: 'number', readOnly: true, sortable: false },
        TotalWorkItemPoints: { type: 'number', readOnly: true, sortable: false },
        TotalWorkItemCount: { type: 'integer', readOnly: true, sortable: false },
        AcceptedWorkItemPoints: { type: 'number', readOnly: true, sortable: false },
        AcceptedWorkItemCount: { type: 'integer', readOnly: true, sortable: false },
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

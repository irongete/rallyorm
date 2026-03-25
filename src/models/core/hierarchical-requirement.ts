import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Hierarchical Requirement
 */
export class HierarchicalRequirement extends RallyEntity {
    static override readonly entityType = 'hierarchicalrequirement';

    static override readonly fields = {
        FinancialWorkType: { type: 'string', maxLength: 256 },
        AIAssisted: { type: 'boolean', readOnly: true },
        FlowStateChangedDate: { type: 'date', readOnly: true },
        ScheduleStatePrefix: { type: 'string', readOnly: true, filterable: false, sortable: false },
        TestCaseCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        PassingTestCaseCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        LastRun: { type: 'date', readOnly: true, filterable: false, sortable: false },
        LastBuild: { type: 'string', readOnly: true, maxLength: 128, filterable: false, sortable: false },
        ScheduleState: { type: 'string', required: true, maxLength: 128, enum: ['Defined', 'In-Progress', 'Completed', 'Accepted'] },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        ReleaseValue: { type: 'string', hidden: true, maxLength: 256, filterable: false, sortable: false },
        IterationValue: { type: 'string', hidden: true, maxLength: 256, filterable: false, sortable: false },
        DirectPassingTestCaseCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        TotalDirectTestCaseCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        PredecessorNotScheduled: { type: 'boolean', readOnly: true, sortable: false },
        DragAndDropRank: { type: 'string', readOnly: true, maxLength: 64 },
        DirectChildrenCount: { type: 'integer', readOnly: true },
        BlockedReason: { type: 'string', maxLength: 256, sortable: false },
        HasParent: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        InProgressDate: { type: 'date', readOnly: true },
        PredecessorScheduledInSameOrLaterIteration: { type: 'boolean', readOnly: true, sortable: false },
        Recycled: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        TestCaseStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'NONE_RUN', 'SOME_RUN_NONE_PASSING', 'SOME_RUN_SOME_NOT_PASSING', 'SOME_RUN_ALL_PASSING', 'ALL_RUN_NONE_PASSING', 'ALL_RUN_SOME_NOT_PASSING', 'ALL_RUN_ALL_PASSING'] },
        DefectStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'SOME_CLOSED', 'NONE_CLOSED', 'ALL_CLOSED'] },
        TaskStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'DEFINED', 'IN_PROGRESS_BLOCKED', 'IN_PROGRESS', 'COMPLETED_BLOCKED', 'COMPLETED'] },
        TaskRemainingTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2 },
        TaskActualTotal: { type: 'number', readOnly: true, hidden: true, maxFractionalDigits: 2 },
        TaskEstimateTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2 },
        Blocked: { type: 'boolean' },
        PlanEstimate: { type: 'number', maxFractionalDigits: 2 },
        AcceptedDate: { type: 'date', readOnly: true },
        Package: { type: 'string', hidden: true, maxLength: 128, enum: ['Package A', 'Package B', 'Package C'], sortable: false },
        FormattedIDPrefix: { type: 'string', required: true, readOnly: true, maxLength: 10, filterable: false, sortable: false },
        FormattedIDID: { type: 'integer', required: true, readOnly: true, filterable: false, sortable: false },
        Expedite: { type: 'boolean' },
        LatestDiscussionAgeInMinutes: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        DisplayColor: { type: 'string', maxLength: 128 },
        Ready: { type: 'boolean' },
        LastUpdateDate: { type: 'date', required: true, readOnly: true },
        Description: { type: 'string', maxLength: 32768 },
        Notes: { type: 'string', maxLength: 32768 },
        Name: { type: 'string', required: true, maxLength: 256 },
        FormattedID: { type: 'string', required: true, readOnly: true, maxLength: 10 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        Ancestors: {
            type: 'hasMany',
            entity: 'PortfolioItem',
            isCollection: true,
            readOnly: true
        },
        Risks: {
            type: 'hasMany',
            entity: 'Risk',
            isCollection: true
        },
        FlowState: {
            type: 'belongsTo',
            entity: 'FlowState',
            isCollection: false,
            foreignKey: 'FlowState'
        },
        MixedChildren: {
            type: 'hasMany',
            entity: 'Artifact',
            isCollection: true,
            readOnly: true
        },
        UnifiedParent: {
            type: 'belongsTo',
            entity: 'RankableArtifact',
            isCollection: false,
            foreignKey: 'UnifiedParent'
        },
        TestCases: {
            type: 'hasMany',
            entity: 'TestCase',
            isCollection: true,
            readOnly: true
        },
        Defects: {
            type: 'hasMany',
            entity: 'Defect',
            isCollection: true,
            readOnly: true
        },
        Blocker: {
            type: 'belongsTo',
            entity: 'Blocker',
            isCollection: false,
            foreignKey: 'Blocker',
            readOnly: true
        },
        Successors: {
            type: 'hasMany',
            entity: 'HierarchicalRequirement',
            isCollection: true
        },
        Predecessors: {
            type: 'hasMany',
            entity: 'HierarchicalRequirement',
            isCollection: true
        },
        Release: {
            type: 'belongsTo',
            entity: 'Release',
            isCollection: false,
            foreignKey: 'Release'
        },
        Iteration: {
            type: 'belongsTo',
            entity: 'Iteration',
            isCollection: false,
            foreignKey: 'Iteration'
        },
        Tasks: {
            type: 'hasMany',
            entity: 'Task',
            isCollection: true,
            readOnly: true
        },
        Children: {
            type: 'hasMany',
            entity: 'HierarchicalRequirement',
            isCollection: true,
            readOnly: true
        },
        Parent: {
            type: 'belongsTo',
            entity: 'HierarchicalRequirement',
            isCollection: false,
            foreignKey: 'Parent'
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
        Attachments: {
            type: 'hasMany',
            entity: 'Attachment',
            isCollection: true
        },
        CreatedBy: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'CreatedBy',
            readOnly: true
        },
        Connections: {
            type: 'hasMany',
            entity: 'Connection',
            isCollection: true,
            readOnly: true
        },
        Milestones: {
            type: 'hasMany',
            entity: 'Milestone',
            isCollection: true
        },
        Changesets: {
            type: 'hasMany',
            entity: 'Changeset',
            isCollection: true
        },
        Owner: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'Owner'
        },
        Tags: {
            type: 'hasMany',
            entity: 'Tag',
            isCollection: true
        },
        Discussion: {
            type: 'hasMany',
            entity: 'ConversationPost',
            isCollection: true,
            readOnly: true
        },
        Project: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'Project'
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'RevisionHistory',
            isCollection: false,
            foreignKey: 'RevisionHistory',
            readOnly: true
        },
        PortfolioItem: {
            type: 'belongsTo',
            entity: 'Feature',
            isCollection: false,
            foreignKey: 'PortfolioItem'
        },
        Feature: {
            type: 'belongsTo',
            entity: 'Feature',
            isCollection: false,
            foreignKey: 'Feature',
            readOnly: true
        },
    };
}

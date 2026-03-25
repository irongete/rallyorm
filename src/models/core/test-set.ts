import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Test Set
 */
export class TestSet extends RallyEntity {
    static override readonly entityType = 'testset';

    static override readonly fields = {
        FinancialWorkType: { type: 'string', maxLength: 256 },
        FlowStateChangedDate: { type: 'date', readOnly: true },
        ScheduleStatePrefix: { type: 'string', readOnly: true, filterable: false, sortable: false },
        ScheduleState: { type: 'string', required: true, maxLength: 128, enum: ['Defined', 'In-Progress', 'Completed', 'Accepted'] },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        TaskActualTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2 },
        TaskRemainingTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2 },
        AcceptedDate: { type: 'date', readOnly: true },
        TaskEstimateTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2 },
        DefectStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'SOME_CLOSED', 'NONE_CLOSED', 'ALL_CLOSED'] },
        LastBuild: { type: 'string', readOnly: true, maxLength: 128, filterable: false, sortable: false },
        LastRun: { type: 'date', readOnly: true, filterable: false, sortable: false },
        TestCaseCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        PassingTestCaseCount: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        TaskStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'DEFINED', 'IN_PROGRESS_BLOCKED', 'IN_PROGRESS', 'COMPLETED_BLOCKED', 'COMPLETED'] },
        DragAndDropRank: { type: 'string', readOnly: true, maxLength: 64 },
        BlockedReason: { type: 'string', maxLength: 256, sortable: false },
        TestCaseStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'NONE_RUN', 'SOME_RUN_NONE_PASSING', 'SOME_RUN_SOME_NOT_PASSING', 'SOME_RUN_ALL_PASSING', 'ALL_RUN_NONE_PASSING', 'ALL_RUN_SOME_NOT_PASSING', 'ALL_RUN_ALL_PASSING'] },
        Blocked: { type: 'boolean' },
        PlanEstimate: { type: 'number', maxFractionalDigits: 2 },
        ReleaseValue: { type: 'string', hidden: true, maxLength: 256, filterable: false, sortable: false },
        IterationValue: { type: 'string', hidden: true, maxLength: 256, filterable: false, sortable: false },
        AIAssisted: { type: 'boolean', readOnly: true },
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
        FlowState: {
            type: 'belongsTo',
            entity: 'FlowState',
            isCollection: false,
            foreignKey: 'FlowState'
        },
        Blocker: {
            type: 'belongsTo',
            entity: 'Blocker',
            isCollection: false,
            foreignKey: 'Blocker',
            readOnly: true
        },
        MixedChildren: {
            type: 'hasMany',
            entity: 'Artifact',
            isCollection: true,
            readOnly: true
        },
        ScheduledTestCases: {
            type: 'hasMany',
            entity: 'ScheduledTestCase',
            isCollection: true,
            readOnly: true
        },
        ScheduledChildren: {
            type: 'hasMany',
            entity: 'Artifact',
            isCollection: true,
            readOnly: true
        },
        Tasks: {
            type: 'hasMany',
            entity: 'Task',
            isCollection: true,
            readOnly: true
        },
        TestCases: {
            type: 'hasMany',
            entity: 'TestCase',
            isCollection: true
        },
        Iteration: {
            type: 'belongsTo',
            entity: 'Iteration',
            isCollection: false,
            foreignKey: 'Iteration'
        },
        Release: {
            type: 'belongsTo',
            entity: 'Release',
            isCollection: false,
            foreignKey: 'Release'
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
    };
}

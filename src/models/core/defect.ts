import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Defect
 */
export class Defect extends RallyEntity {
    static override readonly entityType = 'defect';

    static override readonly fields = {
        FinancialWorkType: { type: 'string', maxLength: 256 },
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
        DragAndDropRank: { type: 'string', readOnly: true, maxLength: 64 },
        BlockedReason: { type: 'string', maxLength: 256, sortable: false },
        InProgressDate: { type: 'date', readOnly: true },
        Recycled: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        TestCaseStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'NONE_RUN', 'SOME_RUN_NONE_PASSING', 'SOME_RUN_SOME_NOT_PASSING', 'SOME_RUN_ALL_PASSING', 'ALL_RUN_NONE_PASSING', 'ALL_RUN_SOME_NOT_PASSING', 'ALL_RUN_ALL_PASSING'] },
        TaskStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'DEFINED', 'IN_PROGRESS_BLOCKED', 'IN_PROGRESS', 'COMPLETED_BLOCKED', 'COMPLETED'] },
        OpenedDate: { type: 'date', readOnly: true },
        TaskRemainingTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2 },
        TaskActualTotal: { type: 'number', readOnly: true, hidden: true, maxFractionalDigits: 2 },
        TaskEstimateTotal: { type: 'number', readOnly: true, maxFractionalDigits: 2 },
        Blocked: { type: 'boolean' },
        PlanEstimate: { type: 'number', maxFractionalDigits: 2 },
        AcceptedDate: { type: 'date', readOnly: true },
        ClosedDate: { type: 'date', readOnly: true },
        VerifiedInBuild: { type: 'string', maxLength: 128 },
        Resolution: { type: 'string', maxLength: 32, enum: ['Architecture', 'Code Change', 'Configuration Change', 'Database Change', 'Duplicate', 'Need More Information', 'Not a Defect', 'Software Limitation', 'User Interface'] },
        FixedInBuild: { type: 'string', maxLength: 128 },
        TargetBuild: { type: 'string', maxLength: 128 },
        TargetDate: { type: 'date' },
        ReleaseNote: { type: 'boolean' },
        AffectsDoc: { type: 'boolean' },
        Priority: { type: 'string', maxLength: 128, enum: ['Resolve Immediately', 'High Attention', 'Normal', 'Low'] },
        FoundInBuild: { type: 'string', maxLength: 128 },
        Environment: { type: 'string', maxLength: 128, enum: ['Development', 'Test', 'Staging', 'Production'] },
        Severity: { type: 'string', maxLength: 128, enum: ['Crash/Data Loss', 'Major Problem', 'Minor Problem', 'Cosmetic'] },
        Package: { type: 'string', hidden: true, maxLength: 128, enum: ['Package A', 'Package B', 'Package C'], sortable: false },
        State: { type: 'string', required: true, maxLength: 128, enum: ['Submitted', 'Open', 'Fixed', 'Closed'] },
        SalesforceCaseNumber: { type: 'string', maxLength: 20 },
        SalesforceCaseID: { type: 'string', maxLength: 20, filterable: false, sortable: false },
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
        MixedChildren: {
            type: 'hasMany',
            entity: 'Artifact',
            isCollection: true,
            readOnly: true
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
        Requirement: {
            type: 'belongsTo',
            entity: 'HierarchicalRequirement',
            isCollection: false,
            foreignKey: 'Requirement'
        },
        DefectSuites: {
            type: 'hasMany',
            entity: 'DefectSuite',
            isCollection: true
        },
        TestCases: {
            type: 'hasMany',
            entity: 'TestCase',
            isCollection: true,
            readOnly: true
        },
        SubmittedBy: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'SubmittedBy'
        },
        Blocker: {
            type: 'belongsTo',
            entity: 'Blocker',
            isCollection: false,
            foreignKey: 'Blocker',
            readOnly: true
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
        Duplicates: {
            type: 'hasMany',
            entity: 'Defect',
            isCollection: true
        },
        TestCaseResult: {
            type: 'belongsTo',
            entity: 'TestCaseResult',
            isCollection: false,
            foreignKey: 'TestCaseResult'
        },
        TestCase: {
            type: 'belongsTo',
            entity: 'TestCase',
            isCollection: false,
            foreignKey: 'TestCase'
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
    };
}

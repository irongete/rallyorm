import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Workspace Configuration
 */
export class WorkspaceConfiguration extends RallyEntity {
    static override readonly entityType = 'workspaceconfiguration';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        PurgeRecycleBinAfterNumberOfDays: { type: 'integer', required: true, filterable: false, sortable: false },
        DefaultTestCaseType: { type: 'string', required: true, maxLength: 128, enum: ['Acceptance', 'Functional', 'Performance', 'Regression', 'Usability', 'User Interface'] },
        DefaultTestCaseVerdict: { type: 'string', required: true, maxLength: 256, enum: ['Blocked', 'Error', 'Fail', 'Inconclusive', 'Pass'] },
        ReleaseLabelPlural: { type: 'string', maxLength: 32, filterable: false, sortable: false },
        ReleaseLabelSingular: { type: 'string', maxLength: 32, filterable: false, sortable: false },
        IterationLabelPlural: { type: 'string', maxLength: 32, filterable: false, sortable: false },
        IterationLabelSingular: { type: 'string', maxLength: 32, filterable: false, sortable: false },
        ProjectLabelPlural: { type: 'string', maxLength: 32, filterable: false, sortable: false },
        RelabelingConfigured: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        ProjectLabelSingular: { type: 'string', maxLength: 32, filterable: false, sortable: false },
        TaskPrefix: { type: 'string', required: true, maxLength: 10, filterable: false, sortable: false },
        DefectSuitePrefix: { type: 'string', required: true, maxLength: 10, filterable: false, sortable: false },
        TestCasePrefix: { type: 'string', required: true, maxLength: 10, filterable: false, sortable: false },
        DefectPrefix: { type: 'string', required: true, maxLength: 10, filterable: false, sortable: false },
        HierarchicalRequirementPrefix: { type: 'string', required: true, maxLength: 10, filterable: false, sortable: false },
        AutoUnblockPortfolioItem: { type: 'boolean', required: true, sortable: false },
        DragDropRankingEnabled: { type: 'boolean', required: true, sortable: false },
        BuildandChangesetEnabled: { type: 'boolean', required: true, sortable: false },
        TimeTrackerEnabled: { type: 'boolean', required: true, sortable: false },
        WorkDays: { type: 'string', required: true, maxLength: 128 },
        TaskUnitName: { type: 'string', required: true, maxLength: 128 },
        IterationEstimateUnitName: { type: 'string', required: true, maxLength: 128 },
        ReleaseEstimateUnitName: { type: 'string', required: true, maxLength: 128 },
        DateTimeFormat: { type: 'string', required: true, maxLength: 128 },
        DateFormat: { type: 'string', required: true, maxLength: 128 },
        TimeZone: { type: 'string', required: true, maxLength: 64 },
        ProjectAdminsCanManageWorkRules: { type: 'boolean', required: true, sortable: false },
        RestrictTimeboxEdit: { type: 'boolean', required: true, sortable: false },
        DefaultProjectAccess: { type: 'string', required: true, enum: ['No Access', 'Viewer', 'Editor'], filterable: false, sortable: false },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        Workspace: {
            type: 'belongsTo',
            entity: 'workspace',
            isCollection: false,
            foreignKey: 'Workspace'
        },
        Subscription: {
            type: 'belongsTo',
            entity: 'subscription',
            isCollection: false,
            foreignKey: 'Subscription',
            readOnly: true
        }
    };
}

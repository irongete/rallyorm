import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Workspace Configuration
 */
export class WorkspaceConfiguration extends RallyEntity {

    declare ObjectUUID?: string;
    declare EnableKnowledgeAndProgressContext?: boolean;
    declare HasPortfolioItemFlowStates?: boolean;
    declare ProjectAdminsCanManagePIFlowStates?: boolean;
    declare PurgeRecycleBinAfterNumberOfDays?: number;
    declare DefaultTestCaseType?: "Acceptance" | "Functional" | "Performance" | "Regression" | "Usability" | "User Interface" | (string & {});
    declare DefaultTestCaseVerdict?: "Blocked" | "Error" | "Fail" | "Inconclusive" | "Pass" | (string & {});
    declare ReleaseLabelPlural?: string | null;
    declare ReleaseLabelSingular?: string | null;
    declare IterationLabelPlural?: string | null;
    declare IterationLabelSingular?: string | null;
    declare ProjectLabelPlural?: string | null;
    declare RelabelingConfigured?: boolean;
    declare ProjectLabelSingular?: string | null;
    declare TaskPrefix?: string;
    declare DefectSuitePrefix?: string;
    declare TestCasePrefix?: string;
    declare DefectPrefix?: string;
    declare HierarchicalRequirementPrefix?: string;
    declare AutoUnblockPortfolioItem?: boolean;
    declare DragDropRankingEnabled?: boolean;
    declare BuildandChangesetEnabled?: boolean;
    declare TimeTrackerEnabled?: boolean;
    declare WorkDays?: string;
    declare TaskUnitName?: string;
    declare IterationEstimateUnitName?: string;
    declare ReleaseEstimateUnitName?: string;
    declare DateTimeFormat?: "" | "yyyy-MM-dd hh:mm a z" | "MM/dd/yyyy hh:mm a z" | "dd/MM/yyyy hh:mm a z" | "yyyy/MM/dd hh:mm a z" | "yyyy-MMM-dd hh:mm a z" | "yyyy-MM-dd HH:mm z" | "MM/dd/yyyy HH:mm z" | "dd/MM/yyyy HH:mm z" | "yyyy/MM/dd HH:mm z" | "yyyy-MMM-dd HH:mm z" | "yyyy-MM-dd z" | "MM/dd/yyyy z" | "dd/MM/yyyy z" | "yyyy/MM/dd z" | "yyyy-MMM-dd z" | "yyyy-MM-dd" | "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy/MM/dd" | "yyyy-MMM-dd" | (string & {});
    declare DateFormat?: "" | "yyyy-MM-dd" | "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy/MM/dd" | "yyyy-MMM-dd" | (string & {});
    declare TimeZone?: string;
    declare ProjectAdminsCanManageWorkRules?: boolean;
    declare RestrictTimeboxEdit?: boolean;
    declare DefaultProjectAccess?: "No Access" | "Viewer" | "Editor" | (string & {});
    declare VersionId?: string | null;
    declare CreationDate?: string | Date;
    declare ObjectID?: number;
    declare PpmConnection?: any;
    declare Workspace?: any;
    declare Subscription?: any;

    static override readonly entityType = 'workspaceconfiguration';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        EnableKnowledgeAndProgressContext: { type: 'boolean', required: true, sortable: false },
        HasPortfolioItemFlowStates: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        ProjectAdminsCanManagePIFlowStates: { type: 'boolean', required: true, sortable: false },
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
        DateTimeFormat: { type: 'string', required: true, maxLength: 128, enum: ['', 'yyyy-MM-dd hh:mm a z', 'MM/dd/yyyy hh:mm a z', 'dd/MM/yyyy hh:mm a z', 'yyyy/MM/dd hh:mm a z', 'yyyy-MMM-dd hh:mm a z', 'yyyy-MM-dd HH:mm z', 'MM/dd/yyyy HH:mm z', 'dd/MM/yyyy HH:mm z', 'yyyy/MM/dd HH:mm z', 'yyyy-MMM-dd HH:mm z', 'yyyy-MM-dd z', 'MM/dd/yyyy z', 'dd/MM/yyyy z', 'yyyy/MM/dd z', 'yyyy-MMM-dd z', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MMM-dd'] },
        DateFormat: { type: 'string', required: true, maxLength: 128, enum: ['', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MMM-dd'] },
        TimeZone: { type: 'string', required: true, maxLength: 64 },
        ProjectAdminsCanManageWorkRules: { type: 'boolean', required: true, sortable: false },
        RestrictTimeboxEdit: { type: 'boolean', required: true, sortable: false },
        DefaultProjectAccess: { type: 'string', required: true, enum: ['No Access', 'Viewer', 'Editor'], filterable: false, sortable: false },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        PpmConnection: {
            type: 'belongsTo',
            entity: 'PPMConnection',
            isCollection: false,
            foreignKey: 'PpmConnection',
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
    };
}

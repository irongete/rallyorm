import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Feature
 */
export class Feature extends RallyEntity {

    declare AICacheWriteTokens?: number | null;
    declare AICacheReadTokens?: number | null;
    declare AIOutputTokens?: number | null;
    declare AIInputTokens?: number | null;
    declare AIUsageEventCountByModel?: string | null;
    declare AITokenUsageByModel?: string | null;
    declare AIUsageEventCount?: number | null;
    declare AITokenTotalUse?: number | null;
    declare UnEstimatedTotalCountRollup?: number | null;
    declare AcceptedTotalEstimateRollup?: number | null;
    declare AcceptedTotalCountRollup?: number | null;
    declare UnEstimatedDefectCountRollup?: number | null;
    declare TotalEstimateRollup?: number | null;
    declare TotalCountRollup?: number | null;
    declare PercentDoneByTotalEstimateRollup?: number | null;
    declare PercentDoneByTotalCountRollup?: number | null;
    declare PercentDoneByDefectEstimateRollup?: number | null;
    declare PercentDoneByDefectCountRollup?: number | null;
    declare DefectPlanEstimateTotalRollup?: number | null;
    declare DefectCountRollup?: number | null;
    declare AcceptedDefectEstimateTotalRollup?: number | null;
    declare AcceptedDefectCountRollup?: number | null;
    declare CapitalApproval?: "" | "None" | "Defined" | "Funded" | "ReadyForCapitalization" | (string & {}) | null;
    declare AIAssisted?: boolean;
    declare RefinedEstimateCount?: number | null;
    declare PreliminaryEstimateCountValue?: number | null;
    declare LastRollupDate?: string | Date | null;
    declare BlockedReason?: string | null;
    declare Blocked?: boolean;
    declare PreliminaryEstimateValue?: number | null;
    declare ReleaseValue?: string | null;
    declare EstimatedProgressByStoryCount?: number | null;
    declare EstimatedProgressByStoryPoints?: number | null;
    declare Recycled?: boolean;
    declare ChildStoryPredecessorNotScheduled?: boolean;
    declare ChildStoryPredecessorScheduledInSameOrLaterIteration?: boolean;
    declare ObjectUUID?: string;
    declare Archived?: boolean;
    declare RefinedEstimate?: number | null;
    declare JobSize?: number | null;
    declare RROEValue?: number | null;
    declare TimeCriticality?: number | null;
    declare UserBusinessValue?: number | null;
    declare WSJFScore?: number | null;
    declare DragAndDropRank?: string | null;
    declare PortfolioItemTypeName?: string | null;
    declare StateChangedDate?: string | Date | null;
    declare DirectChildrenCount?: number | null;
    declare PercentDoneByStoryPlanEstimate?: number | null;
    declare PercentDoneByStoryCount?: number | null;
    declare ActualEndDate?: string | Date | null;
    declare ActualStartDate?: string | Date | null;
    declare PlannedEndDate?: string | Date | null;
    declare PlannedStartDate?: string | Date | null;
    declare UnEstimatedLeafStoryCount?: number | null;
    declare AcceptedLeafStoryPlanEstimateTotal?: number | null;
    declare LeafStoryPlanEstimateTotal?: number | null;
    declare AcceptedLeafStoryCount?: number | null;
    declare LeafStoryCount?: number | null;
    declare InvestmentCategory?: "" | "None" | "Short Term Growth" | "Strategic Growth" | "Cost Savings" | "Maintenance" | (string & {}) | null;
    declare RiskScore?: number | null;
    declare ValueScore?: number | null;
    declare FormattedIDPrefix?: string;
    declare FormattedIDID?: number;
    declare Expedite?: boolean;
    declare LatestDiscussionAgeInMinutes?: number | null;
    declare DisplayColor?: string | null;
    declare Ready?: boolean;
    declare LastUpdateDate?: string | Date;
    declare Description?: string;
    declare Notes?: string;
    declare Name?: string;
    declare FormattedID?: string;
    declare VersionId?: string | null;
    declare CreationDate?: string | Date;
    declare ObjectID?: number;
    declare LateChildCount?: number | null;
    declare Ancestors?: any[];
    declare PortfolioItemFlowState?: any;
    declare Metrics?: any[];
    declare Products?: any[];
    declare Objectives?: any[];
    declare Blocker?: any;
    declare Risks?: any[];
    declare Investments?: any[];
    declare Collaborators?: any[];
    declare Attachments?: any[];
    declare PortfolioItemType?: any;
    declare CapacityPlans?: any[];
    declare PreliminaryEstimate?: any;
    declare Workspace?: any;
    declare Subscription?: any;
    declare CreatedBy?: any;
    declare Connections?: any[];
    declare Milestones?: any[];
    declare Changesets?: any[];
    declare Owner?: any;
    declare Tags?: any[];
    declare Discussion?: any[];
    declare Project?: any;
    declare RevisionHistory?: any;
    declare UserStories?: any[];
    declare Artifacts?: any[];
    declare State?: any;
    declare Parent?: any;
    declare Successors?: any[];
    declare Predecessors?: any[];
    declare Release?: any;
    declare Defects?: any[];

    static override readonly entityType = 'portfolioitem/feature';

    static override readonly fields = {
        AICacheWriteTokens: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        AICacheReadTokens: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        AIOutputTokens: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        AIInputTokens: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        AIUsageEventCountByModel: { type: 'string', readOnly: true, filterable: false, sortable: false },
        AITokenUsageByModel: { type: 'string', readOnly: true, filterable: false, sortable: false },
        AIUsageEventCount: { type: 'integer', readOnly: true },
        AITokenTotalUse: { type: 'integer', readOnly: true },
        UnEstimatedTotalCountRollup: { type: 'integer', readOnly: true, sortable: false },
        AcceptedTotalEstimateRollup: { type: 'number', readOnly: true, sortable: false },
        AcceptedTotalCountRollup: { type: 'integer', readOnly: true, sortable: false },
        UnEstimatedDefectCountRollup: { type: 'integer', readOnly: true, sortable: false },
        TotalEstimateRollup: { type: 'number', readOnly: true, sortable: false },
        TotalCountRollup: { type: 'integer', readOnly: true, sortable: false },
        PercentDoneByTotalEstimateRollup: { type: 'number', readOnly: true, sortable: false },
        PercentDoneByTotalCountRollup: { type: 'number', readOnly: true, sortable: false },
        PercentDoneByDefectEstimateRollup: { type: 'number', readOnly: true, sortable: false },
        PercentDoneByDefectCountRollup: { type: 'number', readOnly: true, sortable: false },
        DefectPlanEstimateTotalRollup: { type: 'number', readOnly: true, sortable: false },
        DefectCountRollup: { type: 'integer', readOnly: true, sortable: false },
        AcceptedDefectEstimateTotalRollup: { type: 'number', readOnly: true, sortable: false },
        AcceptedDefectCountRollup: { type: 'integer', readOnly: true, sortable: false },
        CapitalApproval: { type: 'string', maxLength: 256, enum: ['', 'None', 'Defined', 'Funded', 'ReadyForCapitalization'] },
        AIAssisted: { type: 'boolean', readOnly: true },
        RefinedEstimateCount: { type: 'integer' },
        PreliminaryEstimateCountValue: { type: 'integer', readOnly: true },
        LastRollupDate: { type: 'date', readOnly: true, filterable: false, sortable: false },
        BlockedReason: { type: 'string', maxLength: 256, sortable: false },
        Blocked: { type: 'boolean' },
        PreliminaryEstimateValue: { type: 'integer', readOnly: true },
        ReleaseValue: { type: 'string', hidden: true, maxLength: 256, filterable: false, sortable: false },
        EstimatedProgressByStoryCount: { type: 'number', readOnly: true, filterable: false, sortable: false },
        EstimatedProgressByStoryPoints: { type: 'number', readOnly: true, filterable: false, sortable: false },
        Recycled: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        ChildStoryPredecessorNotScheduled: { type: 'boolean', readOnly: true, sortable: false },
        ChildStoryPredecessorScheduledInSameOrLaterIteration: { type: 'boolean', readOnly: true, sortable: false },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        Archived: { type: 'boolean' },
        RefinedEstimate: { type: 'integer' },
        JobSize: { type: 'integer' },
        RROEValue: { type: 'integer' },
        TimeCriticality: { type: 'integer' },
        UserBusinessValue: { type: 'integer' },
        WSJFScore: { type: 'number' },
        DragAndDropRank: { type: 'string', readOnly: true, maxLength: 64 },
        PortfolioItemTypeName: { type: 'string', readOnly: true, hidden: true, filterable: false },
        StateChangedDate: { type: 'date', readOnly: true },
        DirectChildrenCount: { type: 'integer', readOnly: true },
        PercentDoneByStoryPlanEstimate: { type: 'number', readOnly: true },
        PercentDoneByStoryCount: { type: 'number', readOnly: true },
        ActualEndDate: { type: 'date', readOnly: true },
        ActualStartDate: { type: 'date', readOnly: true },
        PlannedEndDate: { type: 'date' },
        PlannedStartDate: { type: 'date' },
        UnEstimatedLeafStoryCount: { type: 'integer', readOnly: true },
        AcceptedLeafStoryPlanEstimateTotal: { type: 'number', readOnly: true },
        LeafStoryPlanEstimateTotal: { type: 'number', readOnly: true },
        AcceptedLeafStoryCount: { type: 'integer', readOnly: true },
        LeafStoryCount: { type: 'integer', readOnly: true },
        InvestmentCategory: { type: 'string', maxLength: 128, enum: ['', 'None', 'Short Term Growth', 'Strategic Growth', 'Cost Savings', 'Maintenance'] },
        RiskScore: { type: 'integer' },
        ValueScore: { type: 'integer' },
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
        LateChildCount: { type: 'integer', readOnly: true },
    };

    static override readonly relations = {
        Ancestors: {
            type: 'hasMany',
            entity: 'PortfolioItem',
            isCollection: true,
            readOnly: true
        },
        PortfolioItemFlowState: {
            type: 'belongsTo',
            entity: 'BaseKanbanState',
            isCollection: false,
            foreignKey: 'PortfolioItemFlowState'
        },
        Metrics: {
            type: 'hasMany',
            entity: 'VSMMetric',
            isCollection: true,
            readOnly: true
        },
        Products: {
            type: 'hasMany',
            entity: 'VSMProduct',
            isCollection: true,
            readOnly: true
        },
        Objectives: {
            type: 'hasMany',
            entity: 'Objective',
            isCollection: true
        },
        Blocker: {
            type: 'belongsTo',
            entity: 'Blocker',
            isCollection: false,
            foreignKey: 'Blocker',
            readOnly: true
        },
        Risks: {
            type: 'hasMany',
            entity: 'Risk',
            isCollection: true
        },
        Investments: {
            type: 'hasMany',
            entity: 'Investment',
            isCollection: true
        },
        Collaborators: {
            type: 'hasMany',
            entity: 'User',
            isCollection: true,
            readOnly: true
        },
        Attachments: {
            type: 'hasMany',
            entity: 'Attachment',
            isCollection: true
        },
        PortfolioItemType: {
            type: 'belongsTo',
            entity: 'TypeDefinition',
            isCollection: false,
            foreignKey: 'PortfolioItemType',
            readOnly: true
        },
        CapacityPlans: {
            type: 'hasMany',
            entity: 'CapacityPlan',
            isCollection: true
        },
        PreliminaryEstimate: {
            type: 'belongsTo',
            entity: 'PreliminaryEstimate',
            isCollection: false,
            foreignKey: 'PreliminaryEstimate'
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
        UserStories: {
            type: 'hasMany',
            entity: 'HierarchicalRequirement',
            isCollection: true,
            readOnly: true
        },
        Artifacts: {
            type: 'hasMany',
            entity: 'SchedulableArtifact',
            isCollection: true,
            readOnly: true
        },
        State: {
            type: 'belongsTo',
            entity: 'State',
            isCollection: false,
            foreignKey: 'State'
        },
        Parent: {
            type: 'belongsTo',
            entity: 'Initiative',
            isCollection: false,
            foreignKey: 'Parent'
        },
        Successors: {
            type: 'hasMany',
            entity: 'Feature',
            isCollection: true
        },
        Predecessors: {
            type: 'hasMany',
            entity: 'Feature',
            isCollection: true
        },
        Release: {
            type: 'belongsTo',
            entity: 'Release',
            isCollection: false,
            foreignKey: 'Release'
        },
        Defects: {
            type: 'hasMany',
            entity: 'Defect',
            isCollection: true,
            readOnly: true
        },
    };
}

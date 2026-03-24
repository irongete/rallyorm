import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { Artifact } from './artifact.js';

/**
 * Base class for portfolio hierarchy items.
 */
export abstract class PortfolioItem extends Artifact {
    static entityType = 'portfolioitem';
    static isAbstract = true;

    static fields: Record<string, IFieldDefinition> = {
        ...Artifact.fields,

        // Core State & Workflow
        State: {
            type: 'string'
        },
        PortfolioItemType: {
            type: 'object'
        },

        // Hierarchy
        Parent: {
            type: 'object'
        },
        Children: {
            type: 'array'
        },
        Ordinal: {
            type: 'number'
        },

        // User Stories & Work Items
        UserStories: {
            type: 'array'
        },
        LeafStoryCount: {
            type: 'number'
        },
        LeafStoryPlanEstimateTotal: {
            type: 'number'
        },
        AcceptedLeafStoryCount: {
            type: 'number'
        },
        AcceptedLeafStoryPlanEstimateTotal: {
            type: 'number'
        },
        UnEstimatedLeafStoryCount: {
            type: 'number'
        },

        // Progress Metrics
        PercentDoneByStoryCount: {
            type: 'number',
            min: 0,
            max: 100
        },
        PercentDoneByStoryPlanEstimate: {
            type: 'number',
            min: 0,
            max: 100
        },

        // Estimates
        PreliminaryEstimate: {
            type: 'object'
        },
        PreliminaryEstimateValue: {
            type: 'number'
        },
        RefinedEstimate: {
            type: 'number'
        },

        // Dates
        ActualStartDate: {
            type: 'string'
        },
        ActualEndDate: {
            type: 'string'
        },
        PlannedStartDate: {
            type: 'string'
        },
        PlannedEndDate: {
            type: 'string'
        },

        // Blocking & Risk
        Blocked: {
            type: 'boolean'
        },
        BlockedReason: {
            type: 'string'
        },
        Blocker: {
            type: 'object'
        },
        Ready: {
            type: 'boolean'
        },

        // Strategic Planning
        InvestmentCategory: {
            type: 'string'
        },
        ValueScore: {
            type: 'number'
        },
        RiskScore: {
            type: 'number'
        },
        WSJFScore: {
            type: 'number'
        },
        JobSize: {
            type: 'number'
        },
        TimeCriticality: {
            type: 'number'
        },
        RROEValue: {
            type: 'number'
        },

        // Rollup Counts (for all child items)
        AcceptedDefectCountRollup: {
            type: 'number'
        },
        AcceptedDefectEstimateTotalRollup: {
            type: 'number'
        },
        AcceptedTotalCountRollup: {
            type: 'number'
        },
        AcceptedTotalEstimateRollup: {
            type: 'number'
        },
        DefectCountRollup: {
            type: 'number'
        },
        DefectEstimateTotalRollup: {
            type: 'number'
        },
        TotalCountRollup: {
            type: 'number'
        },
        TotalEstimateRollup: {
            type: 'number'
        },

        // Capacity Planning
        CapacityPlanEstimate: {
            type: 'number'
        },
        Capacity: {
            type: 'number'
        },

        // Dependencies
        Predecessors: {
            type: 'array'
        },
        Successors: {
            type: 'array'
        },
        Dependencies: {
            type: 'number'
        },

        // Objectives & Key Results (OKR)
        Objectives: {
            type: 'array'
        },

        // Features & Initiatives specific
        PortfolioItemTypeName: {
            type: 'string'
        },

        // Rally metadata
        AIAssisted: {
            type: 'boolean'
        },

        // Costs
        CostEstimate: {
            type: 'number'
        },
        CostActual: {
            type: 'number'
        },

        // Epics (when Feature is an Epic)
        EpicName: {
            type: 'string'
        },

        // Flow State
        FlowState: {
            type: 'object'
        },
        FlowStateChangedDate: {
            type: 'string'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...Artifact.relations,

        // Hierarchy
        Parent: {
            type: 'belongsTo',
            entity: 'portfolioitem',
            foreignKey: 'Parent'
        },
        Children: {
            type: 'hasMany',
            entity: 'portfolioitem',
            foreignKey: 'Parent',
            inverseRef: true
        },

        // Work Items
        UserStories: {
            type: 'hasMany',
            entity: 'hierarchicalrequirement',
            foreignKey: 'PortfolioItem',
            inverseRef: true
        },

        // Estimates
        PreliminaryEstimate: {
            type: 'belongsTo',
            entity: 'preliminaryestimate',
            foreignKey: 'PreliminaryEstimate'
        },

        // Dependencies
        Predecessors: {
            type: 'hasMany',
            entity: 'portfolioitempredecessorrelationship',
            foreignKey: 'Successor',
            inverseRef: true
        },
        Successors: {
            type: 'hasMany',
            entity: 'portfolioitempredecessorrelationship',
            foreignKey: 'Predecessor',
            inverseRef: true
        },

        // Blocking
        Blocker: {
            type: 'belongsTo',
            entity: 'blocker',
            foreignKey: 'Blocker'
        },

        // OKR
        Objectives: {
            type: 'hasMany',
            entity: 'objective',
            foreignKey: 'PortfolioItem',
            inverseRef: true
        },

        // Flow
        FlowState: {
            type: 'belongsTo',
            entity: 'portfolioitemflowstate',
            foreignKey: 'FlowState'
        }
    };
}

export default PortfolioItem;

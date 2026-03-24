import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { Artifact } from './artifact.js';

/**
 * Base class for artifacts that participate in scheduling.
 */
export abstract class SchedulableArtifact extends Artifact {
    static entityType = 'schedulableartifact';
    static isAbstract = true;

    static fields: Record<string, IFieldDefinition> = {
        ...Artifact.fields,

        // Scheduling
        Iteration: {
            type: 'ref',
            refType: 'Iteration',
            nullable: true
        },
        Release: {
            type: 'ref',
            refType: 'Release',
            nullable: true
        },
        IterationValue: {
            type: 'number',
            readOnly: true,
            nullable: true
        },
        ReleaseValue: {
            type: 'number',
            readOnly: true,
            nullable: true
        },

        // State
        ScheduleState: {
            type: 'string',
            enum: ['Defined', 'In-Progress', 'Completed', 'Accepted']
        },
        ScheduleStatePrefix: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Dates
        AcceptedDate: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        InProgressDate: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Blocking
        Blocked: {
            type: 'boolean',
            nullable: true
        },
        BlockedReason: {
            type: 'string',
            nullable: true
        },
        Blocker: {
            type: 'ref',
            refType: 'Blocker',
            nullable: true
        },

        // Estimation
        PlanEstimate: {
            type: 'number',
            nullable: true
        },
        TaskEstimateTotal: {
            type: 'number',
            readOnly: true,
            nullable: true
        },
        TaskActualTotal: {
            type: 'number',
            readOnly: true,
            nullable: true
        },
        TaskRemainingTotal: {
            type: 'number',
            readOnly: true,
            nullable: true
        },
        TaskStatus: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Workflow
        FlowState: {
            type: 'ref',
            refType: 'FlowState',
            nullable: true
        },
        FlowStateChangedDate: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Testing
        TestCaseCount: {
            type: 'integer',
            readOnly: true,
            nullable: true
        },
        PassingTestCaseCount: {
            type: 'integer',
            readOnly: true,
            nullable: true
        },
        TestCaseStatus: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        LastBuild: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        LastRun: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Other
        Package: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },
        FinancialWorkType: {
            type: 'ref',
            refType: 'TypeDefinition',
            nullable: true
        },
        PortfolioItem: {
            type: 'ref',
            refType: 'PortfolioItem',
            nullable: true
        },
        Ancestors: {
            type: 'collection',
            refType: 'Artifact',
            readOnly: true
        },

        // Collections
        Tasks: {
            type: 'collection',
            refType: 'Task'
        },
        TestCases: {
            type: 'collection',
            refType: 'TestCase'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...Artifact.relations,

        Iteration: {
            type: 'belongsTo',
            entity: 'iteration',
            foreignKey: 'Iteration'
        },
        Release: {
            type: 'belongsTo',
            entity: 'release',
            foreignKey: 'Release'
        },
        Blocker: {
            type: 'belongsTo',
            entity: 'blocker',
            foreignKey: 'Blocker'
        },
        FlowState: {
            type: 'belongsTo',
            entity: 'flowstate',
            foreignKey: 'FlowState'
        },
        PortfolioItem: {
            type: 'belongsTo',
            entity: 'portfolioitem',
            foreignKey: 'PortfolioItem'
        },
        Tasks: {
            type: 'hasMany',
            entity: 'task',
            foreignKey: 'WorkProduct',
            inverseRef: true
        },
        TestCases: {
            type: 'hasMany',
            entity: 'testcase',
            foreignKey: 'WorkProduct',
            inverseRef: true
        }
    };
}

export default SchedulableArtifact;

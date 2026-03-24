import { RallyEntity } from '../base-entity.js';

/**
 * Portfolio-item-flow-state entity.
 *
 * Represents the workflow-state configuration applied specifically to portfolio
 * items such as features and initiatives.
 */
export class PortfolioItemFlowState extends RallyEntity {
    static entityType = 'portfolioitemflowstate';

    static fields = {
        // Core
        Name: {
            type: 'string',
            required: true
        },
        Description: {
            type: 'string'
        },

        // Configuration
        Enabled: {
            type: 'boolean'
        },
        OrderIndex: {
            type: 'number'
        },

        // Workflow
        ExitPolicy: {
            type: 'string'
        },
        AgeThreshold: {
            type: 'number'
        },

        // State Mapping
        ParentStateMapping: {
            type: 'object'
        },

        // Metadata
        CreationDate: {
            type: 'string'
        },
        ObjectID: {
            type: 'number'
        },
        _ref: {
            type: 'string'
        },
        _type: {
            type: 'string'
        }
    };

    static relations = {};
}

export default PortfolioItemFlowState;

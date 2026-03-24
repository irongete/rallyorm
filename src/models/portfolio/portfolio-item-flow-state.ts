import { RallyEntity } from '../base-entity.js';

/**
 * PortfolioItemFlowState
 *
 * Defines workflow states for portfolio items (Features, Initiatives).
 * Similar to State but specifically for portfolio-level work.
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

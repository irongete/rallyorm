import { RallyEntity } from '../base-entity.js';

/**
 * FlowState
 *
 * Kanban board state for work items.
 * Defines custom flow states with WIP limits and exit policies.
 */
export class FlowState extends RallyEntity {
    static entityType = 'flowstate';

    static fields = {
        Name: {
            type: 'string',
            required: true
        },
        Description: {
            type: 'string'
        },
        Enabled: {
            type: 'boolean'
        },
        OrderIndex: {
            type: 'number'
        },
        ExitPolicy: {
            type: 'string'
        },
        AgeThreshold: {
            type: 'number'
        },
        NonValueAdd: {
            type: 'boolean'
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
        },

        Project: {
            type: 'object'
        },
        RevisionHistory: {
            type: 'object'
        }
    };

    static relations = {
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'revisionhistory',
            foreignKey: 'RevisionHistory'
        }
    };
}

export default FlowState;

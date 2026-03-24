import { RallyEntity } from '../base-entity.js';

/**
 * State
 *
 * Defines custom Kanban workflow states for work items.
 * States can have WIP limits, exit policies, and markers for in-progress/accepted.
 *
 * States are project-specific and allow flexible Kanban board configuration.
 */
export class State extends RallyEntity {
    static entityType = 'state';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            required: true,
            maxLength: 128
        },
        Description: {
            type: 'string'
        },

        // Configuration
        Enabled: {
            type: 'boolean'
        },

        // Ordering
        OrderIndex: {
            type: 'number'
        },

        // Workflow Markers
        InProgressMarker: {
            type: 'boolean'
        },
        AcceptedMarker: {
            type: 'boolean'
        },

        // WIP Management
        WIPLimit: {
            type: 'number',
            min: 0
        },

        // Exit Policy
        ExitPolicy: {
            type: 'string'
        },

        // Age Threshold
        AgeThreshold: {
            type: 'number'
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

        // Relationships
        Project: {
            type: 'object'
        },
        TypeDefinition: {
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
        TypeDefinition: {
            type: 'belongsTo',
            entity: 'typedefinition',
            foreignKey: 'TypeDefinition'
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'revisionhistory',
            foreignKey: 'RevisionHistory'
        }
    };
}

export default State;

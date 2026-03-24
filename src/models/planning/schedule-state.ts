import { RallyEntity } from '../base-entity.js';

/**
 * ScheduleState
 *
 * Defines the available schedule states for schedulable artifacts.
 * Standard values: "Defined", "In-Progress", "Completed", "Accepted"
 *
 * ScheduleState is a workspace-level configuration that can be customized.
 */
export class ScheduleState extends RallyEntity {
    static entityType = 'schedulestate';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            required: true,
            maxLength: 128
        },
        ShortName: {
            type: 'string',
            maxLength: 32
        },

        // Configuration
        Enabled: {
            type: 'boolean'
        },
        Editable: {
            type: 'boolean'
        },

        // Ordering
        OrderIndex: {
            type: 'number'
        },

        // WIP Limits
        WIPLimit: {
            type: 'number',
            min: 0
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
        Workspace: {
            type: 'object'
        }
    };

    static relations = {
        Workspace: {
            type: 'belongsTo',
            entity: 'workspace',
            foreignKey: 'Workspace'
        }
    };
}

export default ScheduleState;

import { WorkspaceDomainObject } from '../base/workspace-domain-object.js';

/**
 * Workspace Configuration
 *
 * Stores configuration settings for a Workspace, including time zone,
 * work days, date formats, and iteration schedules.
 */
export class WorkspaceConfiguration extends WorkspaceDomainObject {
    static entityType = 'workspaceconfiguration';

    static fields = {
        ...WorkspaceDomainObject.fields,

        // Time and Format settings
        DateFormat: {
            type: 'string'
        },
        DateTimeFormat: {
            type: 'string'
        },
        TimeZone: {
            type: 'string',
            required: true
        },
        WorkDays: {
            type: 'string',
            required: true
        },

        // Iteration/Sprint settings
        IterationEstimateUnitName: {
            type: 'string'
        },
        ReleaseEstimateUnitName: {
            type: 'string'
        },
        TaskUnitName: {
            type: 'string'
        },

        // Feature flags / System settings
        DragDropRankingEnabled: {
            type: 'boolean'
        },
        TimeTrackerEnabled: {
            type: 'boolean'
        },
        BuildandChangesetEnabled: {
            type: 'boolean'
        }
    };

    static relations = {
        ...WorkspaceDomainObject.relations
    };
}

export default WorkspaceConfiguration;

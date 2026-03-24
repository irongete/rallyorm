import { RallyEntity } from '../base-entity.js';

/**
 * TimeEntryItem
 *
 * Timesheet line item linked to a user, project, or work product.
 * Links a user, project, and work product for time tracking.
 */
export class TimeEntryItem extends RallyEntity {
    static entityType = 'timeentryitem';

    static fields = {
        WorkProduct: { type: 'object' },
        WorkProductDisplayString: { type: 'string' },
        Project: { type: 'object' },
        User: { type: 'object' },
        Task: { type: 'object' },
        TaskDisplayString: { type: 'string' },

        WeekStartDate: { type: 'string' },

        Values: { type: 'array' }, // Array of TimeEntryValue

        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };

    static relations = {
        Values: {
            type: 'hasMany',
            entity: 'timeentryvalue',
            foreignKey: 'TimeEntryItem',
            inverseRef: true
        },
        WorkProduct: {
            type: 'belongsTo',
            entity: 'artifact',
            foreignKey: 'WorkProduct'
        },
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },
        User: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'User'
        },
        Task: {
            type: 'belongsTo',
            entity: 'task',
            foreignKey: 'Task'
        }
    };
}

export default TimeEntryItem;

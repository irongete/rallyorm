import { RallyEntity } from '../base-entity.js';

/**
 * Time-entry-value entity.
 *
 * Represents the hours recorded for a specific date on a Rally time-entry
 * item.
 */
export class TimeEntryValue extends RallyEntity {
    static entityType = 'timeentryvalue';

    static fields = {
        Hours: { type: 'number' },
        DateVal: { type: 'string' }, // The date for the entry

        TimeEntryItem: { type: 'object' },

        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };

    static relations = {
        TimeEntryItem: {
            type: 'belongsTo',
            entity: 'timeentryitem',
            foreignKey: 'TimeEntryItem'
        }
    };
}

export default TimeEntryValue;

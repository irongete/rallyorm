import { RallyEntity } from '../base-entity.js';

/**
 * Panel entity.
 *
 * Represents a visual dashboard widget or panel displayed within a Rally
 * dashboard.
 */
export class Panel extends RallyEntity {
    static entityType = 'panel';

    static fields = {
        Title: { type: 'string' },
        PanelIndex: { type: 'number' },
        PanelDefinition: { type: 'object' },
        Settings: { type: 'string' },
        Dashboard: { type: 'object' },
        CreationDate: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {
        Dashboard: { type: 'belongsTo', entity: 'dashboard', foreignKey: 'Dashboard' }
    };
}

export default Panel;

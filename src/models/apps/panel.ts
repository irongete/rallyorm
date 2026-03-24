import { RallyEntity } from '../base-entity.js';

/**
 * Panel
 *
 * Visual panel or widget displayed on a dashboard.
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

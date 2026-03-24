import { RallyEntity } from '../base-entity.js';

/**
 * Dashboard
 *
 * User dashboard configuration containing panels.
 */
export class Dashboard extends RallyEntity {
    static entityType = 'dashboard';

    static fields = {
        Name: { type: 'string' },
        Layout: { type: 'string' },
        FilterMode: { type: 'string' },
        Panels: { type: 'array' },
        User: { type: 'object' },
        Project: { type: 'object' },
        Workspace: { type: 'object' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };

    static relations = {
        User: { type: 'belongsTo', entity: 'user', foreignKey: 'User' },
        Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' },
        Workspace: { type: 'belongsTo', entity: 'workspace', foreignKey: 'Workspace' },
        Panels: { type: 'hasMany', entity: 'panel', foreignKey: 'Dashboard', inverseRef: true }
    };
}

export default Dashboard;

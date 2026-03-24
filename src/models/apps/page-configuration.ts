import { RallyEntity } from '../base-entity.js';

/**
 * Page-configuration entity.
 *
 * Represents the configuration state for a Rally dashboard page, including its
 * title, persisted layout settings, and other page-level presentation
 * preferences.
 */
export class PageConfiguration extends RallyEntity {
    static entityType = 'pageconfiguration';

    static fields = {
        Title: { type: 'string' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default PageConfiguration;

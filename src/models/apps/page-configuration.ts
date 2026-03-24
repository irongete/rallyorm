import { RallyEntity } from '../base-entity.js';

/**
 * PageConfiguration
 *
 * Configuration settings for a dashboard page.
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

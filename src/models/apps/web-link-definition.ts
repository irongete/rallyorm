import { RallyEntity } from '../base-entity.js';

/**
 * WebLinkDefinition
 *
 * Custom web link definition used within the application.
 */
export class WebLinkDefinition extends RallyEntity {
    static entityType = 'weblinkdefinition';

    static fields = {
        Name: { type: 'string' },
        URL: { type: 'string' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default WebLinkDefinition;

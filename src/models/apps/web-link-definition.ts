import { RallyEntity } from '../base-entity.js';

/**
 * Web-link-definition entity.
 *
 * Represents a custom web-link definition that Rally can expose within the
 * application interface.
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

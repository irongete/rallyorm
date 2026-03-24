import { RallyEntity } from '../base-entity.js';

/**
 * App entity.
 *
 * Represents an installed application, integration endpoint, or app artifact
 * configured within Rally.
 */
export class App extends RallyEntity {
    static entityType = 'app';

    static fields = {
        Title: { type: 'string' },
        Description: { type: 'string' },
        Icon: { type: 'string' },
        SourceCode: { type: 'string' },
        AppCatalogEntry: { type: 'object' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };

    static relations = {};
}

export default App;

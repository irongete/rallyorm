import { RallyEntity } from '../base-entity.js';

/**
 * ExternalSystemCredential
 *
 * Stores credentials for accessing external systems.
 */
export class ExternalSystemCredential extends RallyEntity {
    static entityType = 'externalsystemcredential';
    static fields = {
        Name: { type: 'string' },
        User: { type: 'object' },
        _ref: { type: 'string' }
    };
    static relations = {
        User: { type: 'belongsTo', entity: 'user', foreignKey: 'User' }
    };
}

export default ExternalSystemCredential;

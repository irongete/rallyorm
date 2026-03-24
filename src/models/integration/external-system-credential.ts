import { RallyEntity } from '../base-entity.js';

/**
 * External-system-credential entity.
 *
 * Represents a stored credential used by Rally integrations to access external
 * systems without embedding those secrets directly in integration logic.
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

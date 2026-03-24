import { RallyEntity } from '../base-entity.js';

/**
 * KeyManagementService
 *
 * Service configuration for managing encryption keys.
 */
export class KeyManagementService extends RallyEntity {
    static entityType = 'keymanagementservice';
    static fields = {
        Name: { type: 'string' },
        _ref: { type: 'string' }
    };
    static relations = {};
}

export default KeyManagementService;

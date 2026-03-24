import { RallyEntity } from '../base-entity.js';

/**
 * Key-management-service entity.
 *
 * Represents the service configuration used to manage encryption keys for a
 * Rally environment, including external key-provider integration points.
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

import { RallyEntity } from '../base-entity.js';

/**
 * ConnectAllIntegration
 *
 * Configuration record for ConnectAll integration.
 */
export class ConnectAllIntegration extends RallyEntity {
    static entityType = 'connectallintegration';
    static fields = {
        Name: { type: 'string' },
        Url: { type: 'string' },
        _ref: { type: 'string' }
    };
    static relations = {};
}

export default ConnectAllIntegration;

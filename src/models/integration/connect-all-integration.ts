import { RallyEntity } from '../base-entity.js';

/**
 * Connect-all-integration entity.
 *
 * Represents the configuration record for a ConnectAll integration linked to
 * Rally so external systems can exchange synchronized work and planning data.
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

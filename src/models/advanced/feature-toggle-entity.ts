import { RallyEntity } from '../base-entity.js';

/**
 * Feature toggle entity.
 *
 * Represents a Rally feature flag used to control the availability of specific
 * capabilities or experiences across environments, subscriptions, or targeted
 * rollout scenarios.
 */
export class FeatureToggleEntity extends RallyEntity {
    static entityType = 'featuretoggle';
    static fields = {
        Name: { type: 'string' },
        Enabled: { type: 'boolean' },
        _ref: { type: 'string' }
    };
    static relations = {};
}

export default FeatureToggleEntity;

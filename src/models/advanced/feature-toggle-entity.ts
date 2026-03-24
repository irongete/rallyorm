import { RallyEntity } from '../base-entity.js';

/**
 * FeatureToggle
 *
 * Feature flag used to control availability.
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

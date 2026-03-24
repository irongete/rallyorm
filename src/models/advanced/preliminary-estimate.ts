import { RallyEntity } from '../base-entity.js';

/**
 * PreliminaryEstimate
 *
 * T-shirt sizing or points for high-level portfolio items.
 */
export class PreliminaryEstimate extends RallyEntity {
    static entityType = 'preliminaryestimate';

    static fields = {
        Name: { type: 'string' },
        Value: { type: 'number' },
        Description: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default PreliminaryEstimate;

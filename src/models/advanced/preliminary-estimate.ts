import { RallyEntity } from '../base-entity.js';

/**
 * Preliminary estimate entity.
 *
 * Represents the coarse-grained sizing values used for high-level portfolio
 * planning in Rally.
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

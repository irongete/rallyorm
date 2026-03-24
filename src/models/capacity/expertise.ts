import { RallyEntity } from '../base-entity.js';

/**
 * Expertise entity.
 *
 * Represents a skill or specialization taxonomy value used in Rally capacity
 * planning to classify demand, supply, and assignments by capability.
 */
export class Expertise extends RallyEntity {
    static entityType = 'expertise';
    static fields = {
        Name: { type: 'string' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {};
}

export default Expertise;

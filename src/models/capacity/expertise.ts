import { RallyEntity } from '../base-entity.js';

/**
 * Expertise
 *
 * Skill or specialization definition used in capacity planning.
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

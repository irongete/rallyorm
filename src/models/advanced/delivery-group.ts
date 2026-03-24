import { RallyEntity } from '../base-entity.js';

/**
 * Delivery group entity.
 *
 * Represents a Rally delivery group used to coordinate a set of artifacts that
 * move through delivery together, typically as part of a shared release or
 * cross-team delivery motion.
 */
export class DeliveryGroup extends RallyEntity {
    static entityType = 'deliverygroup';

    static fields = {
        Name: { type: 'string' },
        State: { type: 'string' },
        _ref: { type: 'string' }
    };
    static relations = {};
}

export default DeliveryGroup;

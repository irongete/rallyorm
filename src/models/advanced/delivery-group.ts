import { RallyEntity } from '../base-entity.js';

/**
 * DeliveryGroup
 *
 * Group of artifacts synchronized for delivery.
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

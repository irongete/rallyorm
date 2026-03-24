import { RallyEntity } from '../base-entity.js';

/**
 * Scoped-attribute-definition entity.
 *
 * Represents an attribute definition whose values or availability are scoped to
 * a specific Rally workspace or project context.
 */
export class ScopedAttributeDefinition extends RallyEntity {
    static isAbstract = false;

    static fields = {
        Name: { type: 'string' },
        Values: { type: 'array' },
        CreationDate: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default ScopedAttributeDefinition;

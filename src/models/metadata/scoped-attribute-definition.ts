import { RallyEntity } from '../base-entity.js';

/**
 * ScopedAttributeDefinition
 *
 * Attribute definition scoped to a specific workspace or project context.
 */
export class ScopedAttributeDefinition extends RallyEntity {
    static entityType = 'scopedattributedefinition';

    static fields = {
        Name: { type: 'string' },
        Values: { type: 'array' },
        CreationDate: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default ScopedAttributeDefinition;

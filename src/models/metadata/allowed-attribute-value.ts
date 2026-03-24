import { RallyEntity } from '../base-entity.js';

/**
 * AllowedAttributeValue
 *
 * Valid value for a constrained attribute or enum field.
 */
export class AllowedAttributeValue extends RallyEntity {
    static entityType = 'allowedattributevalue';

    static fields = {
        StringValue: { type: 'string' },
        ValueIndex: { type: 'number' },
        Description: { type: 'string' },
        AttributeDefinition: { type: 'object' },
        CreationDate: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {
        AttributeDefinition: {
            type: 'belongsTo',
            entity: 'attributedefinition',
            foreignKey: 'AttributeDefinition'
        }
    };
}

export default AllowedAttributeValue;

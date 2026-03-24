import { RallyEntity } from '../base-entity.js';

/**
 * Attribute-definition entity.
 *
 * Represents Rally attribute schema metadata, including field shape,
 * constraints, and allowed values for a type definition.
 */
export class AttributeDefinition extends RallyEntity {
    static isAbstract = false;

    static fields = {
        Name: { type: 'string', required: true, maxLength: 256 },
        DisplayName: { type: 'string', nullable: true },
        Description: { type: 'string', nullable: true },
        ElementName: { type: 'string', nullable: true },
        AttributeType: { type: 'string', nullable: true },
        SchemaType: { type: 'string', nullable: true },
        MaxLength: { type: 'integer', nullable: true },
        MaxFractionalDigits: { type: 'integer', nullable: true },
        AllowedQueryOperators: { type: 'collection', refType: 'AllowedQueryOperator' },
        AllowedValues: { type: 'collection', refType: 'AllowedAttributeValue' },
        Constrained: { type: 'boolean', nullable: true },
        Custom: { type: 'boolean', readOnly: true },
        Filterable: { type: 'boolean', readOnly: true },
        Hidden: { type: 'boolean', nullable: true },
        Owned: { type: 'boolean', readOnly: true },
        ReadOnly: { type: 'boolean', readOnly: true },
        Required: { type: 'boolean', nullable: true },
        Sortable: { type: 'boolean', readOnly: true },
        RealAttributeType: { type: 'string', nullable: true },
        CreationDate: { type: 'string', readOnly: true },
        ObjectID: { type: 'integer', readOnly: true },
        ObjectUUID: { type: 'string', readOnly: true },
        VersionId: { type: 'string', readOnly: true },
        TypeDefinition: { type: 'ref', refType: 'TypeDefinition' },
        Subscription: { type: 'ref', refType: 'Subscription' },
        Workspace: { type: 'ref', refType: 'Workspace', nullable: true },
        RevisionHistory: { type: 'ref', refType: 'RevisionHistory', readOnly: true }
    };

    static relations = {
        TypeDefinition: { type: 'belongsTo', entity: 'typedefinition', foreignKey: 'TypeDefinition' },
        RevisionHistory: { type: 'belongsTo', entity: 'revisionhistory', foreignKey: 'RevisionHistory' }
    };
}

export default AttributeDefinition;

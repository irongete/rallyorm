import { RallyEntity } from '../base-entity.js';

/**
 * TypeDefinition
 *
 * Rally type definition and schema metadata.
 * Extends RallyEntity directly without a separate metadata base class.
 */
export class TypeDefinition extends RallyEntity {
    static entityType = 'typedefinition';
    static isAbstract = false;

    static fields = {
        Name: { type: 'string', required: true, maxLength: 256 },
        DisplayName: { type: 'string', nullable: true },
        Description: { type: 'string', nullable: true },
        ElementName: { type: 'string', nullable: true },
        TypePath: { type: 'string', nullable: true },
        IDPrefix: { type: 'string', nullable: true },
        Note: { type: 'string', nullable: true },
        Abstract: { type: 'boolean', readOnly: true },
        Creatable: { type: 'boolean', readOnly: true },
        Copyable: { type: 'boolean', readOnly: true },
        Deletable: { type: 'boolean', readOnly: true },
        Queryable: { type: 'boolean', readOnly: true },
        ReadOnly: { type: 'boolean', readOnly: true },
        Restorable: { type: 'boolean', readOnly: true },
        UserListable: { type: 'boolean', readOnly: true },
        HierarchyConfigurableType: { type: 'boolean', readOnly: true },
        Ordinal: { type: 'integer', readOnly: true },
        CreationDate: { type: 'string', readOnly: true },
        ObjectID: { type: 'integer', readOnly: true },
        ObjectUUID: { type: 'string', readOnly: true },
        VersionId: { type: 'string', readOnly: true },
        Parent: { type: 'ref', refType: 'TypeDefinition', nullable: true },
        AssociatedWorkType: { type: 'ref', refType: 'TypeDefinition', nullable: true },
        Attributes: { type: 'collection', refType: 'AttributeDefinition' },
        Subscription: { type: 'ref', refType: 'Subscription' },
        Workspace: { type: 'ref', refType: 'Workspace', nullable: true },
        RevisionHistory: { type: 'ref', refType: 'RevisionHistory', readOnly: true }
    };

    static relations = {
        Parent: { type: 'belongsTo', entity: 'typedefinition', foreignKey: 'Parent' },
        Attributes: { type: 'hasMany', entity: 'attributedefinition', foreignKey: 'TypeDefinition', inverseRef: true },
        RevisionHistory: { type: 'belongsTo', entity: 'revisionhistory', foreignKey: 'RevisionHistory' }
    };
}

export default TypeDefinition;

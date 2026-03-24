import { WorkspaceDomainObject } from '../base/workspace-domain-object.js';

/**
 * Vsm-product entity.
 *
 * Represents a Value Stream Management product record synchronized into Rally
 * to connect product-level metrics, outcomes, and operational signals.
 */
export class VSMProduct extends WorkspaceDomainObject {
    static entityType = 'vsmproduct';
    static isAbstract = false;

    static fields = {
        ...WorkspaceDomainObject.fields,
        Name: { type: 'string', maxLength: 256 },
        Description: { type: 'string', nullable: true },
        SourceId: { type: 'string', nullable: true },
        SourceSystemMetaData: { type: 'object', nullable: true },
        LastUpdateDate: { type: 'string', readOnly: true },
        CreatedBy: { type: 'ref', refType: 'User', readOnly: true },
        RevisionHistory: { type: 'ref', refType: 'RevisionHistory', readOnly: true }
    };

    static relations = {
        ...WorkspaceDomainObject.relations,
        CreatedBy: { type: 'belongsTo', entity: 'user', foreignKey: 'CreatedBy' },
        RevisionHistory: { type: 'belongsTo', entity: 'revisionhistory', foreignKey: 'RevisionHistory' }
    };
}

export default VSMProduct;

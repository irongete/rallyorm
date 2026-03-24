import { WorkspaceDomainObject } from '../base/workspace-domain-object.js';

/**
 * Vsm-product-portfolio-item entity.
 *
 * Represents the link between a Value Stream Management product and a Rally
 * portfolio item.
 */
export class VSMProductPortfolioItem extends WorkspaceDomainObject {
    static entityType = 'vsmproductportfolioitem';
    static isAbstract = false;

    static fields = {
        ...WorkspaceDomainObject.fields,
        Name: { type: 'string', maxLength: 256 },
        Description: { type: 'string', nullable: true },
        SourceId: { type: 'string', nullable: true },
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

export default VSMProductPortfolioItem;

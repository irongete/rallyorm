import { WorkspaceDomainObject } from '../base/workspace-domain-object.js';

/**
 * Vsm-product-analytics-metric entity.
 *
 * Represents an analytics metric associated with a Value Stream Management
 * product.
 */
export class VSMProductAnalyticsMetric extends WorkspaceDomainObject {
    static entityType = 'vsmproductanalyticsmetric';
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

export default VSMProductAnalyticsMetric;

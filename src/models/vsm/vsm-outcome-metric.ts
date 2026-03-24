import { WorkspaceDomainObject } from '../base/workspace-domain-object.js';

/**
 * Vsm-outcome-metric entity.
 *
 * Represents a metric associated with a Value Stream Management outcome in
 * Rally, allowing outcomes to be measured through quantitative indicators.
 */
export class VSMOutcomeMetric extends WorkspaceDomainObject {
    static entityType = 'vsmoutcomemetric';
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

export default VSMOutcomeMetric;

import { WorkspaceDomainObject } from '../base/workspace-domain-object.js';

/**
 * Vsm-deploy entity.
 *
 * Represents a Value Stream Management deployment record synchronized into
 * Rally to connect deployment events with value-stream outcomes and analytics.
 */
export class VSMDeploy extends WorkspaceDomainObject {
    static entityType = 'vsmdeploy';
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

export default VSMDeploy;

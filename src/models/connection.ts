import { WorkspaceDomainObject } from './base/workspace-domain-object.js';

/**
 * Connection entity.
 *
 * Represents a workspace-scoped connection record linking Rally artifacts to
 * related external or internal references.
 */
export class Connection extends WorkspaceDomainObject {
    static entityType = 'connection';

    static fields = {
        ...WorkspaceDomainObject.fields,

        Artifact: {
            type: 'ref',
            refType: 'Artifact',
            nullable: true
        }
    };

    static relations = {
        ...WorkspaceDomainObject.relations,

        Artifact: {
            type: 'belongsTo',
            entity: 'artifact',
            foreignKey: 'Artifact'
        }
    };
}

export default Connection;
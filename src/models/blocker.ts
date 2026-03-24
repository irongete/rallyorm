import { WorkspaceDomainObject } from './base/workspace-domain-object.js';

/**
 * Blocker entity.
 *
 * Represents a blocker record used to track dependencies, issues, or risks that
 * impede Rally work.
 */
export class Blocker extends WorkspaceDomainObject {
    static entityType = 'blocker';

    static fields = {
        ...WorkspaceDomainObject.fields,

        Description: {
            type: 'string',
            required: true
        },
        Status: {
            type: 'enum',
            values: ['Open', 'Closed']
        },
        Notes: {
            type: 'string'
        },
        Type: {
            type: 'enum',
            values: ['Dependency', 'Issue', 'Risk']
        }
    };

    static relations = {
        ...WorkspaceDomainObject.relations,

        Owner: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'Owner'
        },
        BlockedBy: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'BlockedBy'
        }
    };
}

export default Blocker;
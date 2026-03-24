import { WorkspaceDomainObject } from './base/workspace-domain-object.js';

/**
 * Iteration entity.
 *
 * Represents a Rally iteration or sprint used to plan and track time-boxed work
 * delivery.
 */
export class Iteration extends WorkspaceDomainObject {
    static entityType = 'iteration';
    static isAbstract = false;

    static fields = {
        ...WorkspaceDomainObject.fields,

        // Identity
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        Notes: {
            type: 'string',
            nullable: true
        },
        Theme: {
            type: 'string',
            nullable: true
        },

        // Time box
        StartDate: {
            type: 'string',
            required: true
        },
        EndDate: {
            type: 'string',
            required: true
        },
        State: {
            type: 'string',
            enum: ['Planning', 'Committed', 'Accepted']
        },

        // Metrics
        PlanEstimate: {
            type: 'number',
            readOnly: true,
            nullable: true
        },
        PlannedVelocity: {
            type: 'number',
            nullable: true
        },
        TaskEstimateTotal: {
            type: 'number',
            readOnly: true,
            nullable: true
        },
        TaskActualTotal: {
            type: 'number',
            readOnly: true,
            nullable: true
        },
        TaskRemainingTotal: {
            type: 'number',
            readOnly: true,
            nullable: true
        },

        // Hierarchy
        SyncedWithParent: {
            type: 'boolean',
            nullable: true
        },
        CascadedToChildren: {
            type: 'boolean',
            nullable: true
        },
        ChildrenPlannedVelocity: {
            type: 'number',
            readOnly: true,
            nullable: true
        },

        // Timestamps
        LastUpdateDate: {
            type: 'string',
            readOnly: true
        },

        // References
        Project: {
            type: 'ref',
            refType: 'Project'
        },
        RevisionHistory: {
            type: 'ref',
            refType: 'RevisionHistory',
            readOnly: true
        },

        // Collections
        WorkProducts: {
            type: 'collection',
            refType: 'Artifact'
        },
        UserIterationCapacities: {
            type: 'collection',
            refType: 'UserIterationCapacity'
        }
    };

    static relations = {
        ...WorkspaceDomainObject.relations,

        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'revisionhistory',
            foreignKey: 'RevisionHistory'
        },
        WorkProducts: {
            type: 'hasMany',
            entity: 'artifact',
            foreignKey: 'Iteration',
            inverseRef: true
        },
        UserIterationCapacities: {
            type: 'hasMany',
            entity: 'useriterationcapacity',
            foreignKey: 'Iteration',
            inverseRef: true
        }
    };
}

export default Iteration;

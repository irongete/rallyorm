import { WorkspaceDomainObject } from './base/workspace-domain-object.js';

/**
 * Release
 *
 * Release record used to group work within Rally.
 */
export class Release extends WorkspaceDomainObject {
    static entityType = 'release';
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
        Version: {
            type: 'string',
            nullable: true
        },

        // Time box
        ReleaseStartDate: {
            type: 'string',
            required: true
        },
        ReleaseDate: {
            type: 'string',
            required: true
        },
        State: {
            type: 'string',
            enum: ['Planning', 'Active', 'Accepted']
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
        Accepted: {
            type: 'number',
            readOnly: true,
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
        ReleaseBacklogItemsCount: {
            type: 'integer',
            readOnly: true,
            nullable: true
        },
        GrossEstimateConversionRatio: {
            type: 'number',
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
            foreignKey: 'Release',
            inverseRef: true
        }
    };
}

export default Release;

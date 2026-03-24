import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { WorkspaceDomainObject } from './workspace-domain-object.js';

/**
 * Base class for Rally artifacts.
 *
 * Provides the common identity, ownership, tagging, discussion, and attachment
 * fields shared by Rally work artifacts.
 */
export abstract class Artifact extends WorkspaceDomainObject {
    static entityType = 'artifact';
    static isAbstract = true;

    static fields: Record<string, IFieldDefinition> = {
        ...WorkspaceDomainObject.fields,

        // Identity
        FormattedID: {
            type: 'string',
            readOnly: true
        },
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        Description: {
            type: 'string',
            maxLength: 32768,
            nullable: true
        },
        Notes: {
            type: 'string',
            maxLength: 32768,
            nullable: true
        },

        // Timestamps
        LastUpdateDate: {
            type: 'string',
            readOnly: true
        },

        // Display
        DisplayColor: {
            type: 'string',
            nullable: true
        },
        DragAndDropRank: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Flags
        AIAssisted: {
            type: 'boolean',
            readOnly: true,
            nullable: true
        },
        Expedite: {
            type: 'boolean',
            nullable: true
        },
        Ready: {
            type: 'boolean',
            nullable: true
        },
        Recycled: {
            type: 'boolean',
            readOnly: true,
            nullable: true
        },

        // Computed metrics
        LatestDiscussionAgeInMinutes: {
            type: 'integer',
            readOnly: true,
            nullable: true
        },

        // References
        Project: {
            type: 'ref',
            refType: 'Project'
        },
        Owner: {
            type: 'ref',
            refType: 'User',
            nullable: true
        },
        CreatedBy: {
            type: 'ref',
            refType: 'User',
            readOnly: true
        },
        RevisionHistory: {
            type: 'ref',
            refType: 'RevisionHistory',
            readOnly: true
        },

        // Collections
        Tags: {
            type: 'collection',
            refType: 'Tag'
        },
        Milestones: {
            type: 'collection',
            refType: 'Milestone'
        },
        Attachments: {
            type: 'collection',
            refType: 'Attachment'
        },
        Discussion: {
            type: 'collection',
            refType: 'ConversationPost'
        },
        Changesets: {
            type: 'collection',
            refType: 'Changeset'
        },
        Connections: {
            type: 'collection',
            refType: 'Connection'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...WorkspaceDomainObject.relations,

        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },
        Owner: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'Owner'
        },
        CreatedBy: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'CreatedBy'
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'revisionhistory',
            foreignKey: 'RevisionHistory'
        },
        Tags: {
            type: 'hasMany',
            entity: 'tag',
            foreignKey: 'Tags',
            isCollection: true
        },
        Milestones: {
            type: 'hasMany',
            entity: 'milestone',
            foreignKey: 'Artifacts',
            inverseRef: true
        },
        Attachments: {
            type: 'hasMany',
            entity: 'attachment',
            foreignKey: 'Artifact',
            inverseRef: true
        },
        Discussion: {
            type: 'hasMany',
            entity: 'conversationpost',
            foreignKey: 'Artifact',
            inverseRef: true
        },
        Changesets: {
            type: 'hasMany',
            entity: 'changeset',
            foreignKey: 'Artifacts',
            inverseRef: true
        },
        Connections: {
            type: 'hasMany',
            entity: 'connection',
            foreignKey: 'Artifact',
            inverseRef: true
        }
    };
}

export default Artifact;

import { WorkspaceDomainObject } from '../base/workspace-domain-object.js';

/**
 * Conversation-post entity.
 *
 * Represents a discussion post attached to a Rally artifact for threaded
 * collaboration and audit context.
 */
export class ConversationPost extends WorkspaceDomainObject {
    static entityType = 'conversationpost';

    static fields = {
        ...WorkspaceDomainObject.fields,

        // Post Content
        Text: {
            type: 'string',
            required: true
            // Comment/discussion text
        },

        // Post Metadata
        PostNumber: {
            type: 'number'
            // Sequential number within the artifact's discussion
        },

        // Relationships
        Artifact: {
            type: 'object',
            required: true
            // Artifact being discussed
        },
        User: {
            type: 'object',
            required: true
            // User who made the post
        },

        // Timestamps
        CreationDate: {
            type: 'string'
        },
        LastUpdateDate: {
            type: 'string'
        },

        // Metadata
        ObjectID: {
            type: 'number'
        },
        _ref: {
            type: 'string'
        },
        _type: {
            type: 'string'
        }
    };

    static relations = {
        ...WorkspaceDomainObject.relations,
        Artifact: {
            type: 'belongsTo',
            entity: 'artifact',
            foreignKey: 'Artifact'
        },
        User: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'User'
        }
    };
}

export default ConversationPost;

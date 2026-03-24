import { RallyEntity } from '../base-entity.js';

/**
 * Objective-conversation-post entity.
 *
 * Represents a discussion post associated specifically with an OKR objective so
 * teams can capture objective-level collaboration and commentary.
 */
export class ObjectiveConversationPost extends RallyEntity {
    static entityType = 'objectiveconversationpost';
    static fields = {
        Text: { type: 'string' },
        Objective: { type: 'object' },
        User: { type: 'object' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {
        Objective: { type: 'belongsTo', entity: 'objective', foreignKey: 'Objective' },
        User: { type: 'belongsTo', entity: 'user', foreignKey: 'User' }
    };
}

export default ObjectiveConversationPost;

import { RallyEntity } from '../base-entity.js';

/**
 * ObjectiveConversationPost
 *
 * Discussion post associated with a specific objective.
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

import { RallyEntity } from '../base-entity.js';

/**
 * Attachment-content entity.
 *
 * Represents the binary payload for an attachment record. The companion
 * attachment entity stores metadata, while this entity carries the encoded file
 * content itself.
 */
export class AttachmentContent extends RallyEntity {
    static entityType = 'attachmentcontent';

    static fields = {
        // Binary Content
        Content: {
            type: 'string'
        },

        // Metadata
        CreationDate: {
            type: 'string'
        },
        ObjectID: {
            type: 'number'
        },
        _ref: {
            type: 'string'
        },
        _refObjectUUID: {
            type: 'string'
        },
        _type: {
            type: 'string'
        }
    };

    static relations = {};
}

export default AttachmentContent;

import { RallyEntity } from '../base-entity.js';

/**
 * AttachmentContent
 *
 * Stores the binary content for an Attachment.
 * The Attachment entity has metadata, while AttachmentContent holds the actual file data.
 * Content is usually Base64 encoded.
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

import { RallyEntity } from './base-entity.js';

/**
 * Attachment entity.
 *
 * Represents a file attachment linked to a Rally artifact together with its
 * metadata.
 */
export class Attachment extends RallyEntity {
    static entityType = 'attachment';

    static fields = {
        // Core fields
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        Description: {
            type: 'string',
            maxLength: 768
        },
        ContentType: {
            type: 'string',
            required: true
        },
        Size: {
            type: 'number'
        }
    };

    static relations = {
        // Relationships
        Artifact: {
            type: 'belongsTo',
            entity: 'object',
            foreignKey: 'Artifact'
        },
        TestCaseResult: {
            type: 'belongsTo',
            entity: 'testcaseresult',
            foreignKey: 'TestCaseResult'
        },
        User: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'User'
        },
        Content: {
            type: 'belongsTo',
            entity: 'attachmentcontent',
            foreignKey: 'Content'
        }
    };
}

export default Attachment;

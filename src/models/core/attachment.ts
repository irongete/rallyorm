import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Attachment
 */
export class Attachment extends RallyEntity {

    declare ObjectUUID?: string;
    declare Compressed?: boolean;
    declare Description?: string;
    declare Size?: number | null;
    declare ContentType?: string;
    declare Name?: string;
    declare VersionId?: string | null;
    declare CreationDate?: string | Date;
    declare ObjectID?: number;
    declare TestCaseResult?: any;
    declare Artifact?: any;
    declare Workspace?: any;
    declare Subscription?: any;
    declare User?: any;
    declare Content?: any;

    static override readonly entityType = 'attachment';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        Compressed: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        Description: { type: 'string', maxLength: 768 },
        Size: { type: 'integer', readOnly: true },
        ContentType: { type: 'string', required: true, maxLength: 128 },
        Name: { type: 'string', required: true, maxLength: 1024 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        TestCaseResult: {
            type: 'belongsTo',
            entity: 'TestCaseResult',
            isCollection: false,
            foreignKey: 'TestCaseResult'
        },
        Artifact: {
            type: 'belongsTo',
            entity: 'Artifact',
            isCollection: false,
            foreignKey: 'Artifact'
        },
        Workspace: {
            type: 'belongsTo',
            entity: 'Workspace',
            isCollection: false,
            foreignKey: 'Workspace'
        },
        Subscription: {
            type: 'belongsTo',
            entity: 'Subscription',
            isCollection: false,
            foreignKey: 'Subscription',
            readOnly: true
        },
        User: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'User'
        },
        Content: {
            type: 'belongsTo',
            entity: 'AttachmentContent',
            isCollection: false,
            foreignKey: 'Content'
        },
    };
}

import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Task
 */
export class Task extends RallyEntity {
    static override readonly entityType = 'task';

    static override readonly fields = {
        AIAssisted: { type: 'boolean', readOnly: true },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        TimeSpent: { type: 'number', readOnly: true, maxFractionalDigits: 2, filterable: false, sortable: false },
        DragAndDropRank: { type: 'string', readOnly: true, maxLength: 64 },
        BlockedReason: { type: 'string', maxLength: 256, sortable: false },
        Recycled: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        TaskIndex: { type: 'integer', required: true },
        Blocked: { type: 'boolean' },
        State: { type: 'string', required: true, maxLength: 128, enum: ['Defined', 'In-Progress', 'Completed'] },
        Actuals: { type: 'number', hidden: true, maxFractionalDigits: 2 },
        ToDo: { type: 'number', maxFractionalDigits: 2 },
        Estimate: { type: 'number', maxFractionalDigits: 2 },
        FormattedIDPrefix: { type: 'string', required: true, readOnly: true, maxLength: 10, filterable: false, sortable: false },
        FormattedIDID: { type: 'integer', required: true, readOnly: true, filterable: false, sortable: false },
        Expedite: { type: 'boolean' },
        LatestDiscussionAgeInMinutes: { type: 'integer', readOnly: true, filterable: false, sortable: false },
        DisplayColor: { type: 'string', maxLength: 128 },
        Ready: { type: 'boolean' },
        LastUpdateDate: { type: 'date', required: true, readOnly: true },
        Description: { type: 'string', maxLength: 32768 },
        Notes: { type: 'string', maxLength: 32768 },
        Name: { type: 'string', required: true, maxLength: 256 },
        FormattedID: { type: 'string', required: true, readOnly: true, maxLength: 10 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
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
        WorkProduct: {
            type: 'belongsTo',
            entity: 'SchedulableArtifact',
            isCollection: false,
            foreignKey: 'WorkProduct'
        },
        Project: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'Project',
            readOnly: true
        },
        Release: {
            type: 'belongsTo',
            entity: 'Release',
            isCollection: false,
            foreignKey: 'Release',
            readOnly: true
        },
        Iteration: {
            type: 'belongsTo',
            entity: 'Iteration',
            isCollection: false,
            foreignKey: 'Iteration',
            readOnly: true
        },
        Attachments: {
            type: 'hasMany',
            entity: 'Attachment',
            isCollection: true
        },
        CreatedBy: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'CreatedBy',
            readOnly: true
        },
        Connections: {
            type: 'hasMany',
            entity: 'Connection',
            isCollection: true,
            readOnly: true
        },
        Milestones: {
            type: 'hasMany',
            entity: 'Milestone',
            isCollection: true
        },
        Changesets: {
            type: 'hasMany',
            entity: 'Changeset',
            isCollection: true
        },
        Owner: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'Owner'
        },
        Tags: {
            type: 'hasMany',
            entity: 'Tag',
            isCollection: true
        },
        Discussion: {
            type: 'hasMany',
            entity: 'ConversationPost',
            isCollection: true,
            readOnly: true
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'RevisionHistory',
            isCollection: false,
            foreignKey: 'RevisionHistory',
            readOnly: true
        },
    };
}

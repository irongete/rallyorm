import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Test Case
 */
export class TestCase extends RallyEntity {
    static override readonly entityType = 'testcase';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        DragAndDropRank: { type: 'string', readOnly: true, maxLength: 64 },
        Recycled: { type: 'boolean', readOnly: true, filterable: false, sortable: false },
        DefectStatus: { type: 'string', required: true, readOnly: true, enum: ['NONE', 'SOME_CLOSED', 'NONE_CLOSED', 'ALL_CLOSED'] },
        LastVerdict: { type: 'string', readOnly: true, maxLength: 128, enum: ['Blocked', 'Error', 'Fail', 'Inconclusive', 'Pass'] },
        LastRun: { type: 'date', readOnly: true },
        LastBuild: { type: 'string', readOnly: true, maxLength: 128 },
        ValidationExpectedResult: { type: 'string', maxLength: 32768, sortable: false },
        ValidationInput: { type: 'string', maxLength: 32768, sortable: false },
        Package: { type: 'string', hidden: true, maxLength: 128, enum: ['Package A', 'Package B', 'Package C'], sortable: false },
        Risk: { type: 'string', maxLength: 128, enum: ['Low', 'Medium', 'High'] },
        Priority: { type: 'string', maxLength: 128, enum: ['Useful', 'Important', 'Critical'] },
        PostConditions: { type: 'string', maxLength: 32768 },
        PreConditions: { type: 'string', maxLength: 32768 },
        Type: { type: 'string', required: true, maxLength: 128, enum: ['Acceptance', 'Functional', 'Performance', 'Regression', 'Usability', 'User Interface'] },
        Method: { type: 'string', required: true, maxLength: 128, enum: ['Manual', 'Automated'] },
        Objective: { type: 'string', maxLength: 32768 },
        AIAssisted: { type: 'boolean', readOnly: true },
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
        TestFolderHierarchy: {
            type: 'hasMany',
            entity: 'TestFolder',
            isCollection: true,
            readOnly: true
        },
        LastResult: {
            type: 'belongsTo',
            entity: 'TestCaseResult',
            isCollection: false,
            foreignKey: 'LastResult',
            readOnly: true
        },
        TestSets: {
            type: 'hasMany',
            entity: 'TestSet',
            isCollection: true
        },
        WorkProduct: {
            type: 'belongsTo',
            entity: 'SchedulableArtifact',
            isCollection: false,
            foreignKey: 'WorkProduct'
        },
        Defects: {
            type: 'hasMany',
            entity: 'Defect',
            isCollection: true,
            readOnly: true
        },
        TestFolder: {
            type: 'belongsTo',
            entity: 'TestFolder',
            isCollection: false,
            foreignKey: 'TestFolder'
        },
        Steps: {
            type: 'hasMany',
            entity: 'TestCaseStep',
            isCollection: true,
            readOnly: true
        },
        Attachments: {
            type: 'hasMany',
            entity: 'Attachment',
            isCollection: true
        },
        Results: {
            type: 'hasMany',
            entity: 'TestCaseResult',
            isCollection: true,
            readOnly: true
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
        Project: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'Project'
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

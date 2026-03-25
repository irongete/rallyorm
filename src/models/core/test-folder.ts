import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Test Folder
 */
export class TestFolder extends RallyEntity {
    static override readonly entityType = 'testfolder';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        FormattedID: { type: 'string', required: true, readOnly: true, maxLength: 10 },
        Name: { type: 'string', required: true, maxLength: 256 },
        DisplayColor: { type: 'string', maxLength: 128 },
        Description: { type: 'string', maxLength: 32768 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'RevisionHistory',
            isCollection: false,
            foreignKey: 'RevisionHistory',
            readOnly: true
        },
        RecursiveTestCases: {
            type: 'hasMany',
            entity: 'TestCase',
            isCollection: true,
            readOnly: true
        },
        Descendants: {
            type: 'hasMany',
            entity: 'WorkspaceDomainObject',
            isCollection: true
        },
        Parent: {
            type: 'belongsTo',
            entity: 'TestFolder',
            isCollection: false,
            foreignKey: 'Parent'
        },
        Children: {
            type: 'hasMany',
            entity: 'TestFolder',
            isCollection: true
        },
        Project: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'Project'
        },
        TestCases: {
            type: 'hasMany',
            entity: 'TestCase',
            isCollection: true
        },
        TestFolderStatus: {
            type: 'belongsTo',
            entity: 'TestFolderStatus',
            isCollection: false,
            foreignKey: 'TestFolderStatus',
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
    };
}

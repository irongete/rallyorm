import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Workspace
 */
export class Workspace extends RallyEntity {
    static override readonly entityType = 'workspace';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        SchemaVersion: { type: 'string', readOnly: true, sortable: false },
        Style: { type: 'string', required: true, readOnly: true, maxLength: 128, filterable: false, sortable: false },
        State: { type: 'string', required: true, maxLength: 128, enum: ['Open', 'Closed'] },
        Notes: { type: 'string', maxLength: 4000 },
        Description: { type: 'string', maxLength: 32768 },
        Name: { type: 'string', required: true, maxLength: 256 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        Tags: {
            type: 'hasMany',
            entity: 'Tag',
            isCollection: true,
            readOnly: true
        },
        WorkRules: {
            type: 'hasMany',
            entity: 'WorkRule',
            isCollection: true,
            readOnly: true
        },
        Children: {
            type: 'hasMany',
            entity: 'Project',
            isCollection: true,
            readOnly: true
        },
        Subscription: {
            type: 'belongsTo',
            entity: 'Subscription',
            isCollection: false,
            foreignKey: 'Subscription',
            readOnly: true
        },
        Owner: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'Owner'
        },
        TypeDefinitions: {
            type: 'hasMany',
            entity: 'TypeDefinition',
            isCollection: true,
            readOnly: true
        },
        WorkspaceConfiguration: {
            type: 'belongsTo',
            entity: 'WorkspaceConfiguration',
            isCollection: false,
            foreignKey: 'WorkspaceConfiguration',
            readOnly: true
        },
        RevisionHistory: {
            type: 'belongsTo',
            entity: 'RevisionHistory',
            isCollection: false,
            foreignKey: 'RevisionHistory',
            readOnly: true
        },
        Projects: {
            type: 'hasMany',
            entity: 'Project',
            isCollection: true,
            readOnly: true
        },
    };
}

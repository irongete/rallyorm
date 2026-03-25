import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Project
 */
export class Project extends RallyEntity {
    static override readonly entityType = 'project';

    static override readonly fields = {
        LastUpdatedDate: { type: 'date', required: true, readOnly: true },
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        SchemaVersion: { type: 'string', readOnly: true, sortable: false },
        TaskStateRollupEnabled: { type: 'boolean', sortable: false },
        Name: { type: 'string', required: true, maxLength: 128 },
        State: { type: 'string', required: true, maxLength: 128, enum: ['Open', 'Closed'] },
        Notes: { type: 'string', maxLength: 32768 },
        Description: { type: 'string', maxLength: 32768 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        Objectives: {
            type: 'hasMany',
            entity: 'Objective',
            isCollection: true
        },
        AllUsers: {
            type: 'hasMany',
            entity: 'User',
            isCollection: true,
            readOnly: true
        },
        WorkRules: {
            type: 'hasMany',
            entity: 'WorkRule',
            isCollection: true,
            readOnly: true
        },
        Milestones: {
            type: 'hasMany',
            entity: 'Milestone',
            isCollection: true
        },
        Workspace: {
            type: 'belongsTo',
            entity: 'Workspace',
            isCollection: false,
            foreignKey: 'Workspace'
        },
        Viewers: {
            type: 'hasMany',
            entity: 'User',
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
        Editors: {
            type: 'hasMany',
            entity: 'User',
            isCollection: true,
            readOnly: true
        },
        TeamMembers: {
            type: 'hasMany',
            entity: 'User',
            isCollection: true,
            readOnly: true
        },
        Owner: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'Owner'
        },
        BuildDefinitions: {
            type: 'hasMany',
            entity: 'BuildDefinition',
            isCollection: true,
            readOnly: true
        },
        Children: {
            type: 'hasMany',
            entity: 'Project',
            isCollection: true,
            readOnly: true
        },
        Parent: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'Parent'
        },
        Releases: {
            type: 'hasMany',
            entity: 'Release',
            isCollection: true,
            readOnly: true
        },
        Iterations: {
            type: 'hasMany',
            entity: 'Iteration',
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
    };
}

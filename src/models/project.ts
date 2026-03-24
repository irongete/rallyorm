import { RallyEntity } from './base-entity.js';

/**
 * Project
 *
 * Rally project container for planning work, assigning teams, and grouping iterations and releases.
 */
export class Project extends RallyEntity {
    static entityType = 'project';

    static fields = {
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        Description: {
            type: 'string'
        },
        Notes: {
            type: 'string'
        },
        State: {
            type: 'enum',
            values: ['Planning', 'Open', 'Closed']
        },
        SchemaVersion: {
            type: 'string'
        },
        TaskStateRollupEnabled: {
            type: 'boolean'
        }
    };

    static relations = {
        // Ownership
        Owner: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'Owner'
        },

        // Related records
        UserStories: {
            type: 'hasMany',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Project',
            inverseRef: true
        },
        Tasks: {
            type: 'hasMany',
            entity: 'task',
            foreignKey: 'Project',
            inverseRef: true
        },
        Defects: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'Project',
            inverseRef: true
        },
        TestCases: {
            type: 'hasMany',
            entity: 'testcase',
            foreignKey: 'Project',
            inverseRef: true
        },
        Iterations: {
            type: 'hasMany',
            entity: 'iteration',
            foreignKey: 'Project',
            inverseRef: true
        },
        Releases: {
            type: 'hasMany',
            entity: 'release',
            foreignKey: 'Project',
            inverseRef: true
        },
        TeamMembers: {
            type: 'hasMany',
            entity: 'user',
            foreignKey: 'TeamMemberships',
            isCollection: true
        }
    };

}

export default Project;

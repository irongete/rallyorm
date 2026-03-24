import { RallyEntity } from './base-entity.js';

/**
 * Project entity.
 *
 * Represents a Rally project container used to plan work, assign teams, and
 * group iterations and releases.
 */
export class Project extends RallyEntity {
    static entityType = 'project';

    static fields = {
        /**
         * Display name of the project in Rally.
         */
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        /**
         * Longer descriptive text for the project.
         */
        Description: {
            type: 'string'
        },
        /**
         * Free-form notes maintained on the project record.
         */
        Notes: {
            type: 'string'
        },
        /**
         * Lifecycle state of the project.
         */
        State: {
            type: 'enum',
            values: ['Planning', 'Open', 'Closed']
        },
        /**
         * Schema version metadata reported by Rally.
         */
        SchemaVersion: {
            type: 'string'
        },
        /**
         * Whether task state is rolled up automatically for artifacts in the project.
         */
        TaskStateRollupEnabled: {
            type: 'boolean'
        }
    };

    static relations = {
        // Ownership
        /**
         * User who owns the project.
         */
        Owner: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'Owner'
        },

        // Related records
        /**
         * User stories assigned to this project.
         */
        UserStories: {
            type: 'hasMany',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Project',
            inverseRef: true
        },
        /**
         * Tasks assigned to this project.
         */
        Tasks: {
            type: 'hasMany',
            entity: 'task',
            foreignKey: 'Project',
            inverseRef: true
        },
        /**
         * Defects assigned to this project.
         */
        Defects: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'Project',
            inverseRef: true
        },
        /**
         * Test cases maintained within this project.
         */
        TestCases: {
            type: 'hasMany',
            entity: 'testcase',
            foreignKey: 'Project',
            inverseRef: true
        },
        /**
         * Iterations planned for this project.
         */
        Iterations: {
            type: 'hasMany',
            entity: 'iteration',
            foreignKey: 'Project',
            inverseRef: true
        },
        /**
         * Releases associated with this project.
         */
        Releases: {
            type: 'hasMany',
            entity: 'release',
            foreignKey: 'Project',
            inverseRef: true
        },
        /**
         * Team members participating in the project.
         */
        TeamMembers: {
            type: 'hasMany',
            entity: 'user',
            foreignKey: 'TeamMemberships',
            isCollection: true
        }
    };

}

export default Project;

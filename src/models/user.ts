import { RallyEntity } from './base-entity.js';

/**
 * User entity.
 *
 * Represents a Rally user record, including identity, account state, profile,
 * and team membership information.
 */
export class User extends RallyEntity {
    static entityType = 'user';

    static fields = {
        // Identity
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        EmailAddress: {
            type: 'string',
            required: true
        },
        UserName: {
            type: 'string'
        },
        FirstName: {
            type: 'string'
        },
        LastName: {
            type: 'string'
        },
        MiddleName: {
            type: 'string'
        },
        DisplayName: {
            type: 'string'
        },
        ShortDisplayName: {
            type: 'string'
        },
        Role: {
            type: 'enum',
            values: ['Admin', 'User', 'Editor', 'Viewer']
        },

        // Status
        Disabled: {
            type: 'boolean'
        },
        Deleted: {
            type: 'boolean'
        },

        // Organization
        Department: {
            type: 'string'
        },
        CostCenter: {
            type: 'string'
        },
        OfficeLocation: {
            type: 'string'
        },
        Phone: {
            type: 'string'
        },

        // Dates
        LastLoginDate: {
            type: 'string'
        },
        LastPasswordUpdateDate: {
            type: 'string'
        }
    };

    static relations = {
        // Owned or created records
        OwnedUserStories: {
            type: 'hasMany',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Owner',
            inverseRef: true
        },
        OwnedTasks: {
            type: 'hasMany',
            entity: 'task',
            foreignKey: 'Owner',
            inverseRef: true
        },
        OwnedDefects: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'Owner',
            inverseRef: true
        },
        OwnedTestCases: {
            type: 'hasMany',
            entity: 'testcase',
            foreignKey: 'Owner',
            inverseRef: true
        },
        CreatedUserStories: {
            type: 'hasMany',
            entity: 'hierarchicalrequirement',
            foreignKey: 'SubmittedBy',
            inverseRef: true
        },
        CreatedDefects: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'SubmittedBy',
            inverseRef: true
        },
        TestCaseResults: {
            type: 'hasMany',
            entity: 'testcaseresult',
            foreignKey: 'Tester',
            inverseRef: true
        },

        // Team membership
        TeamMemberships: {
            type: 'hasMany',
            entity: 'project',
            foreignKey: 'TeamMembers',
            isCollection: true,
            inverseRef: true
        }
    };
}
export default User;

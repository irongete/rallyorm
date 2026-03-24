import { RallyEntity } from './base-entity.js';

/**
 * Test-folder entity.
 *
 * Represents a hierarchical container used to organize Rally test cases and
 * related testing assets.
 */
export class TestFolder extends RallyEntity {
    static entityType = 'testfolder';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        FormattedID: {
            type: 'string'
        },
        Description: {
            type: 'string'
        },

        // Display
        DisplayColor: {
            type: 'string'
        }
    };

    static relations = {
        // Relationships
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },
        Parent: {
            type: 'belongsTo',
            entity: 'testfolder',
            foreignKey: 'Parent'
        },

        // Relationships
        Children: {
            type: 'hasMany',
            entity: 'testfolder',
            foreignKey: 'Parent',
            inverseRef: true
        },
        TestCases: {
            type: 'hasMany',
            entity: 'testcase',
            foreignKey: 'TestFolder',
            inverseRef: true
        }
    };
}

export default TestFolder;

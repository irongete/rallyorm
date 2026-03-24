import { RallyEntity } from './base-entity.js';

/**
 * TestCaseResult
 * Result of a test case execution.
 */
export class TestCaseResult extends RallyEntity {
    static entityType = 'testcaseresult';

    static fields = {
        // Core fields
        Date: {
            type: 'string',
            required: true
        },
        Verdict: {
            type: 'enum',
            required: true,
            values: ['Pass', 'Fail', 'Inconclusive', 'Error']
        },
        Build: {
            type: 'string',
            maxLength: 256
        },
        Duration: {
            type: 'number',
            min: 0
        },
        Notes: {
            type: 'string'
        }
    };

    static relations = {
        // Relationships
        TestCase: {
            type: 'belongsTo',
            entity: 'testcase',
            foreignKey: 'TestCase'
        },
        TestSet: {
            type: 'belongsTo',
            entity: 'testset',
            foreignKey: 'TestSet'
        },
        Tester: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'Tester'
        },
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },

        // Relationships
        Attachments: {
            type: 'hasMany',
            entity: 'attachment',
            foreignKey: 'TestCaseResult',
            inverseRef: true
        }
    };
}

export default TestCaseResult;

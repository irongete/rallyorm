import { RallyEntity } from './base-entity.js';

/**
 * TestCaseStep
 * Individual step defined within a test case.
 */
export class TestCaseStep extends RallyEntity {
    static entityType = 'testcasestep';

    static fields = {
        // Core fields
        StepIndex: {
            type: 'number',
            required: true,
            min: 0
        },
        Input: {
            type: 'string',
            required: true
        },
        ExpectedResult: {
            type: 'string',
            required: true
        }
    };

    static relations = {
        // Relationships
        TestCase: {
            type: 'belongsTo',
            entity: 'testcase',
            foreignKey: 'TestCase'
        }
    };
}

export default TestCaseStep;

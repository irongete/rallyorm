import { SchedulableArtifact } from './base/schedulable-artifact.js';

/**
 * Test-set entity.
 *
 * Represents a schedulable grouping of test cases that Rally can execute within
 * an iteration or release context.
 */
export class TestSet extends SchedulableArtifact {
    static entityType = 'testset';
    static isAbstract = false;

    static fields = {
        ...SchedulableArtifact.fields
    };

    static relations = {
        ...SchedulableArtifact.relations,

        TestCases: {
            type: 'hasMany',
            entity: 'testcase',
            foreignKey: 'TestSets',
            inverseRef: true
        },
        TestCaseResults: {
            type: 'hasMany',
            entity: 'testcaseresult',
            foreignKey: 'TestSet',
            inverseRef: true
        }
    };
}

export default TestSet;

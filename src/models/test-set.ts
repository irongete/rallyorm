import { SchedulableArtifact } from './base/schedulable-artifact.js';

/**
 * TestSet
 *
 * A container for TestCases scheduled for execution within an Iteration or Release.
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

import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { SchedulableArtifact } from '../base/schedulable-artifact.js';

/**
 * ScheduledTestCase
 *
 * Links a TestCase to a specific Iteration or Release for planned execution.
 * Inherits scheduling fields from SchedulableArtifact (Iteration, Release, ScheduleState, etc.).
 */
export class ScheduledTestCase extends SchedulableArtifact {
    static entityType = 'scheduledtestcase';
    static isAbstract = false;

    static fields: Record<string, IFieldDefinition> = {
        ...SchedulableArtifact.fields,

        // Test Case
        TestCase: {
            type: 'object'
        },
        TestSet: {
            type: 'object'
        },

        // Assignment
        Tester: {
            type: 'object'
        },

        // Results
        Results: {
            type: 'array'
        },
        LastResult: {
            type: 'object'
        },
        LastVerdict: {
            type: 'enum',
            values: ['Pass', 'Fail', 'Inconclusive', 'Error', 'Blocked']
        },
        LastRun: {
            type: 'string'
        },

        AIAssisted: {
            type: 'boolean'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...SchedulableArtifact.relations,

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

        Results: {
            type: 'hasMany',
            entity: 'testcaseresult',
            foreignKey: 'ScheduledTestCase',
            inverseRef: true
        },
        LastResult: {
            type: 'belongsTo',
            entity: 'testcaseresult',
            foreignKey: 'LastResult'
        }
    };
}

export default ScheduledTestCase;

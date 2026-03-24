import { Artifact } from './base/artifact.js';

/**
 * Test case model.
 */
export class TestCase extends Artifact {
    static entityType = 'testcase';
    static isAbstract = false;

    static fields = {
        ...Artifact.fields,

        // Test definition
        Method: {
            type: 'string',
            nullable: true
        },
        Type: {
            type: 'string',
            nullable: true
        },
        Priority: {
            type: 'string',
            nullable: true
        },
        Risk: {
            type: 'string',
            nullable: true
        },

        // Test content
        Objective: {
            type: 'string',
            maxLength: 32768,
            nullable: true
        },
        PreConditions: {
            type: 'string',
            maxLength: 32768,
            nullable: true
        },
        PostConditions: {
            type: 'string',
            maxLength: 32768,
            nullable: true
        },
        ValidationInput: {
            type: 'string',
            maxLength: 32768,
            nullable: true
        },
        ValidationExpectedResult: {
            type: 'string',
            maxLength: 32768,
            nullable: true
        },

        // Organization
        Package: {
            type: 'string',
            nullable: true
        },

        // Execution status
        LastVerdict: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        LastRun: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        LastBuild: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Defect tracking
        DefectStatus: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // References
        WorkProduct: {
            type: 'ref',
            refType: 'Artifact',
            nullable: true
        },
        TestFolder: {
            type: 'ref',
            refType: 'TestFolder',
            nullable: true
        },

        // Collections
        Steps: {
            type: 'collection',
            refType: 'TestCaseStep'
        },
        Results: {
            type: 'collection',
            refType: 'TestCaseResult'
        },
        LastResult: {
            type: 'ref',
            refType: 'TestCaseResult',
            readOnly: true,
            nullable: true
        },
        Defects: {
            type: 'collection',
            refType: 'Defect'
        },
        TestSets: {
            type: 'collection',
            refType: 'TestSet'
        }
    };

    static relations = {
        ...Artifact.relations,

        WorkProduct: {
            type: 'belongsTo',
            entity: 'artifact',
            foreignKey: 'WorkProduct'
        },
        TestFolder: {
            type: 'belongsTo',
            entity: 'testfolder',
            foreignKey: 'TestFolder'
        },
        Steps: {
            type: 'hasMany',
            entity: 'testcasestep',
            foreignKey: 'TestCase',
            inverseRef: true
        },
        Results: {
            type: 'hasMany',
            entity: 'testcaseresult',
            foreignKey: 'TestCase',
            inverseRef: true
        },
        Defects: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'TestCase',
            inverseRef: true
        },
        TestSets: {
            type: 'hasMany',
            entity: 'testset',
            foreignKey: 'TestCases',
            inverseRef: true
        }
    };
}

export default TestCase;

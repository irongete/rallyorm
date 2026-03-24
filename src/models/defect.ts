import { SchedulableArtifact } from './base/schedulable-artifact.js';

/**
 * Defect
 *
 * Work item used to track defects in Rally.
 */
export class Defect extends SchedulableArtifact {
    static entityType = 'defect';
    static isAbstract = false;

    static fields = {
        ...SchedulableArtifact.fields,

        // Defect state
        /**
         * Defect state: Submitted, Open, Fixed, Closed
         */
        State: {
            type: 'string',
            enum: ['Submitted', 'Open', 'Fixed', 'Closed', 'None']
        },
        /**
         * Priority level
         */
        Priority: {
            type: 'string',
            enum: ['Resolve Immediately', 'High Attention', 'Normal', 'Low', 'None']
        },
        /**
         * Severity level
         */
        Severity: {
            type: 'string',
            enum: ['Crash/Data Loss', 'Major Problem', 'Minor Problem', 'Cosmetic', 'None']
        },
        /**
         * Resolution type
         */
        Resolution: {
            type: 'string',
            nullable: true
        },

        // Environment
        /**
         * Environment where defect was found
         */
        Environment: {
            type: 'string',
            enum: ['Development', 'Test', 'Staging', 'Production', ''],
            nullable: true
        },
        /**
         * Whether defect affects documentation
         */
        AffectsDoc: {
            type: 'boolean',
            nullable: true
        },

        // Build tracking
        /**
         * Build where defect was found
         */
        FoundInBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },
        /**
         * Build where defect was fixed
         */
        FixedInBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },
        /**
         * Build where fix was verified
         */
        VerifiedInBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },
        /**
         * Target build for fix
         */
        TargetBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },

        // Dates
        /**
         * Date defect was opened (ISO 8601)
         */
        OpenedDate: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        /**
         * Date defect was closed (ISO 8601)
         */
        ClosedDate: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        /**
         * Target date for resolution (ISO 8601)
         */
        TargetDate: {
            type: 'string',
            nullable: true
        },

        // Salesforce integration
        /**
         * Salesforce case ID
         */
        SalesforceCaseID: {
            type: 'string',
            nullable: true
        },
        /**
         * Salesforce case number
         */
        SalesforceCaseNumber: {
            type: 'string',
            nullable: true
        },

        // Release notes
        /**
         * Release note text
         */
        ReleaseNote: {
            type: 'boolean',
            nullable: true
        },

        // References
        /**
         * User who submitted the defect
         */
        SubmittedBy: {
            type: 'ref',
            refType: 'User',
            nullable: true
        },
        /**
         * Associated requirement/user story
         */
        Requirement: {
            type: 'ref',
            refType: 'HierarchicalRequirement',
            nullable: true
        },
        /**
         * Associated test case
         */
        TestCase: {
            type: 'ref',
            refType: 'TestCase',
            nullable: true
        },
        /**
         * Test case result that found this defect
         */
        TestCaseResult: {
            type: 'ref',
            refType: 'TestCaseResult',
            nullable: true
        },

        // Collections
        /**
         * Defect suites containing this defect
         */
        DefectSuites: {
            type: 'collection',
            refType: 'DefectSuite'
        },
        /**
         * Duplicate defects
         */
        Duplicates: {
            type: 'collection',
            refType: 'Defect'
        }
    };

    static relations = {
        ...SchedulableArtifact.relations,

        SubmittedBy: {
            type: 'belongsTo',
            entity: 'user',
            foreignKey: 'SubmittedBy'
        },
        Requirement: {
            type: 'belongsTo',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Requirement'
        },
        TestCase: {
            type: 'belongsTo',
            entity: 'testcase',
            foreignKey: 'TestCase'
        },
        TestCaseResult: {
            type: 'belongsTo',
            entity: 'testcaseresult',
            foreignKey: 'TestCaseResult'
        },
        DefectSuites: {
            type: 'hasMany',
            entity: 'defectsuite',
            foreignKey: 'Defects',
            inverseRef: true
        },
        Duplicates: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'DuplicateOf',
            inverseRef: true
        }
    };
}

export default Defect;

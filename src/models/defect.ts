import { SchedulableArtifact } from './base/schedulable-artifact.js';

/**
 * Defect entity.
 *
 * Represents a work item used to track defects in Rally.
 *
 * Defects extend {@link SchedulableArtifact} with lifecycle, severity,
 * environment, build-tracking, and validation relationships that are specific
 * to defect management workflows.
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
         * Priority used to communicate urgency and response expectations.
         */
        Priority: {
            type: 'string',
            enum: ['Resolve Immediately', 'High Attention', 'Normal', 'Low', 'None']
        },
        /**
         * Severity used to communicate the impact of the defect.
         */
        Severity: {
            type: 'string',
            enum: ['Crash/Data Loss', 'Major Problem', 'Minor Problem', 'Cosmetic', 'None']
        },
        /**
         * Resolution chosen when the defect is fixed or otherwise closed.
         */
        Resolution: {
            type: 'string',
            nullable: true
        },

        // Environment
        /**
         * Environment in which the issue was originally observed.
         */
        Environment: {
            type: 'string',
            enum: ['Development', 'Test', 'Staging', 'Production', ''],
            nullable: true
        },
        /**
         * Indicates whether the defect also requires documentation changes.
         */
        AffectsDoc: {
            type: 'boolean',
            nullable: true
        },

        // Build tracking
        /**
         * Build identifier where the defect was first found.
         */
        FoundInBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },
        /**
         * Build identifier where the fix was introduced.
         */
        FixedInBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },
        /**
         * Build identifier where the fix was verified.
         */
        VerifiedInBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },
        /**
         * Planned build target for the defect resolution.
         */
        TargetBuild: {
            type: 'string',
            maxLength: 256,
            nullable: true
        },

        // Dates
        /**
         * Timestamp when the defect was opened in Rally, in ISO 8601 format.
         */
        OpenedDate: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        /**
         * Timestamp when the defect was closed in Rally, in ISO 8601 format.
         */
        ClosedDate: {
            type: 'string',
            readOnly: true,
            nullable: true
        },
        /**
         * Target date for resolving the defect, in ISO 8601 format.
         */
        TargetDate: {
            type: 'string',
            nullable: true
        },

        // Salesforce integration
        /**
         * External Salesforce case identifier associated with the defect.
         */
        SalesforceCaseID: {
            type: 'string',
            nullable: true
        },
        /**
         * Human-readable Salesforce case number associated with the defect.
         */
        SalesforceCaseNumber: {
            type: 'string',
            nullable: true
        },

        // Release notes
        /**
         * Whether the defect should be surfaced in release-note outputs.
         */
        ReleaseNote: {
            type: 'boolean',
            nullable: true
        },

        // References
        /**
         * User who originally submitted or reported the defect.
         */
        SubmittedBy: {
            type: 'ref',
            refType: 'User',
            nullable: true
        },
        /**
         * User story or requirement that the defect is associated with.
         */
        Requirement: {
            type: 'ref',
            refType: 'HierarchicalRequirement',
            nullable: true
        },
        /**
         * Test case directly associated with the defect.
         */
        TestCase: {
            type: 'ref',
            refType: 'TestCase',
            nullable: true
        },
        /**
         * Test case result that exposed or logged this defect.
         */
        TestCaseResult: {
            type: 'ref',
            refType: 'TestCaseResult',
            nullable: true
        },

        // Collections
        /**
         * Defect suites that include this defect.
         */
        DefectSuites: {
            type: 'collection',
            refType: 'DefectSuite'
        },
        /**
         * Related defects marked as duplicates of this defect.
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

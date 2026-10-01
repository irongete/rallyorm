import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Test Case Result
 */
export class TestCaseResult extends RallyEntity {

    declare ObjectUUID?: string;
    declare Duration?: number | null;
    declare Notes?: string;
    declare Verdict?: "Blocked" | "Error" | "Fail" | "Inconclusive" | "Pass" | (string & {});
    declare Date?: string | Date;
    declare Build?: string;
    declare VersionId?: string | null;
    declare CreationDate?: string | Date;
    declare ObjectID?: number;
    declare Project?: any;
    declare WorkProduct?: any;
    declare Tester?: any;
    declare TestSet?: any;
    declare Attachments?: any[];
    declare TestCase?: any;
    declare Workspace?: any;
    declare Subscription?: any;

    static override readonly entityType = 'testcaseresult';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        Duration: { type: 'number' },
        Notes: { type: 'string', maxLength: 32768 },
        Verdict: { type: 'string', required: true, maxLength: 256, enum: ['Blocked', 'Error', 'Fail', 'Inconclusive', 'Pass'] },
        Date: { type: 'date', required: true },
        Build: { type: 'string', required: true, maxLength: 128 },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
        Project: {
            type: 'belongsTo',
            entity: 'Project',
            isCollection: false,
            foreignKey: 'Project',
            readOnly: true
        },
        WorkProduct: {
            type: 'belongsTo',
            entity: 'SchedulableArtifact',
            isCollection: false,
            foreignKey: 'WorkProduct',
            readOnly: true
        },
        Tester: {
            type: 'belongsTo',
            entity: 'User',
            isCollection: false,
            foreignKey: 'Tester'
        },
        TestSet: {
            type: 'belongsTo',
            entity: 'TestSet',
            isCollection: false,
            foreignKey: 'TestSet'
        },
        Attachments: {
            type: 'hasMany',
            entity: 'Attachment',
            isCollection: true
        },
        TestCase: {
            type: 'belongsTo',
            entity: 'TestCase',
            isCollection: false,
            foreignKey: 'TestCase'
        },
        Workspace: {
            type: 'belongsTo',
            entity: 'Workspace',
            isCollection: false,
            foreignKey: 'Workspace'
        },
        Subscription: {
            type: 'belongsTo',
            entity: 'Subscription',
            isCollection: false,
            foreignKey: 'Subscription',
            readOnly: true
        },
    };
}

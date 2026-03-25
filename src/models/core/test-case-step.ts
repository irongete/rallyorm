import { RallyEntity } from '../base-entity.js';

/**
 * Generated model for Test Case Step
 */
export class TestCaseStep extends RallyEntity {
    static override readonly entityType = 'testcasestep';

    static override readonly fields = {
        ObjectUUID: { type: 'string', required: true, readOnly: true, maxLength: 36, sortable: false },
        ExpectedResult: { type: 'string', maxLength: 2048 },
        Input: { type: 'string', required: true, maxLength: 2048 },
        StepIndex: { type: 'integer', required: true },
        VersionId: { type: 'string', readOnly: true, maxLength: 10 },
        CreationDate: { type: 'date', required: true, readOnly: true },
        ObjectID: { type: 'integer', required: true, readOnly: true },
    };

    static override readonly relations = {
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

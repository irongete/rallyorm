import { RallyEntity } from '../base-entity.js';

/**
 * Test-folder-status entity.
 *
 * Represents the aggregated execution metrics and rollup counts for a Rally
 * test folder.
 */
export class TestFolderStatus extends RallyEntity {
    static entityType = 'testfolderstatus';

    static fields = {
        // Test Result Counts
        PassingCount: {
            type: 'number',
            min: 0
        },
        FailedCount: {
            type: 'number',
            min: 0
        },
        NoResultCount: {
            type: 'number',
            min: 0
        },
        OthersCount: {
            type: 'number',
            min: 0
        },
        TotalCount: {
            type: 'number',
            min: 0
        },
        BlockedCount: {
            type: 'number',
            min: 0
        },
        InconclusiveCount: {
            type: 'number',
            min: 0
        },

        // Metadata
        CreationDate: {
            type: 'string'
        },
        ObjectID: {
            type: 'number'
        },
        _ref: {
            type: 'string'
        },
        _type: {
            type: 'string'
        }
    };

    static relations = {
        TestFolder: {
            type: 'belongsTo',
            entity: 'testfolder',
            foreignKey: 'TestFolder'
        }
    };
}

export default TestFolderStatus;

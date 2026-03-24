import { RallyEntity } from '../base-entity.js';

/**
 * Iteration cumulative-flow-data entity.
 *
 * Represents the historical analytics points used to render cumulative flow
 * diagrams for a Rally iteration.
 */
export class IterationCumulativeFlowData extends RallyEntity {
    static entityType = 'iterationcumulativeflowdata';

    static fields = {
        CardCount: { type: 'number' },
        CardEstimateTotal: { type: 'number' },
        CardRelatedState: { type: 'string' },
        CardState: { type: 'string' },
        IterationObjectID: { type: 'number' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default IterationCumulativeFlowData;

import { RallyEntity } from '../base-entity.js';

/**
 * IterationCumulativeFlowData
 *
 * Analytics data for Iteration Cumulative Flow Diagrams (CFD).
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

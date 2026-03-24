import { RallyEntity } from '../base-entity.js';

/**
 * ReleaseCumulativeFlowData
 *
 * Analytics data for Release Cumulative Flow Diagrams (CFD).
 */
export class ReleaseCumulativeFlowData extends RallyEntity {
    static entityType = 'releasecumulativeflowdata';

    static fields = {
        CardCount: { type: 'number' },
        CardEstimateTotal: { type: 'number' },
        CardRelatedState: { type: 'string' },
        CardState: { type: 'string' },
        ReleaseObjectID: { type: 'number' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default ReleaseCumulativeFlowData;

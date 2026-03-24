import { RallyEntity } from '../base-entity.js';

/**
 * Release cumulative-flow-data entity.
 *
 * Represents the historical analytics points used to render cumulative flow
 * diagrams for a Rally release.
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

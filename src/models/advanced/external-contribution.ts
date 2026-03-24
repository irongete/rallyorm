import { RallyEntity } from '../base-entity.js';

/**
 * ExternalContribution
 *
 * Contribution or work item originating from an external system.
 */
export class ExternalContribution extends RallyEntity {
    static entityType = 'externalcontribution';

    static fields = {
        Name: { type: 'string' },
        ExternalId: { type: 'string' },
        _ref: { type: 'string' }
    };
    static relations = {};
}

export default ExternalContribution;

import { RallyEntity } from '../base-entity.js';

/**
 * External contribution entity.
 *
 * Represents a contribution or work item synchronized into Rally from an
 * external system so planning data can reference work originating outside the
 * native Rally workflow.
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

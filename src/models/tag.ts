import { RallyEntity } from './base-entity.js';

/**
 * Tag entity.
 *
 * Represents a Rally tag that can be associated with artifacts for labeling and
 * classification.
 */
export class Tag extends RallyEntity {
    static entityType = 'tag';

    static fields = {
        // Core fields
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        Archived: {
            type: 'boolean'
        },
        UsageCount: {
            type: 'number'
        }
    };

    static relations = {};
}

export default Tag;

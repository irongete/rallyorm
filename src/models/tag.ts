import { RallyEntity } from './base-entity.js';

/**
 * Tag model.
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

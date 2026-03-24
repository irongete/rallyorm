import { RallyEntity } from './base-entity.js';

/**
 * Milestone entity.
 *
 * Represents a milestone used to mark significant checkpoints across Rally
 * artifacts and planning timelines.
 */
export class Milestone extends RallyEntity {
    static entityType = 'milestone';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        FormattedID: {
            type: 'string'
        },
        Description: {
            type: 'string'
        },
        Notes: {
            type: 'string'
        },

        // Dates
        TargetDate: {
            type: 'string'
        },

        // Display
        DisplayColor: {
            type: 'string'
        }
    };

    static relations = {
        // Collections (many-to-many)
        Artifacts: {
            type: 'hasMany',
            entity: 'object',
            foreignKey: 'Milestones',
            isCollection: true
        },
        Projects: {
            type: 'hasMany',
            entity: 'project',
            foreignKey: 'Milestones',
            isCollection: true
        }
    };
}

export default Milestone;

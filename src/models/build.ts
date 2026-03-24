import { RallyEntity } from './base-entity.js';

/**
 * Build model.
 */
export class Build extends RallyEntity {
    static entityType = 'build';

    static fields = {
        // Core identification
        Number: {
            type: 'string',
            maxLength: 256
        },
        Uri: {
            type: 'string'
        },
        Message: {
            type: 'string'
        },

        // Execution details
        Status: {
            type: 'enum',
            values: ['SUCCESS', 'FAILURE', 'UNSTABLE']
        },
        Duration: {
            type: 'number',
            min: 0
        },
        Start: {
            type: 'string'
        }
    };

    static relations = {
        // Definition
        BuildDefinition: {
            type: 'belongsTo',
            entity: 'builddefinition',
            foreignKey: 'BuildDefinition'
        },

        // Related changesets
        Changesets: {
            type: 'hasMany',
            entity: 'changeset',
            foreignKey: 'Builds',
            inverseRef: true
        }
    };
}

export default Build;

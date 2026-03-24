import { RallyEntity } from './base-entity.js';

/**
 * BuildDefinition
 * Build configuration used by Rally integrations.
 */
export class BuildDefinition extends RallyEntity {
    static entityType = 'builddefinition';

    static fields = {
        // Core identification
        Name: {
            type: 'string',
            required: true,
            maxLength: 256
        },
        Description: {
            type: 'string'
        },
        Uri: {
            type: 'string'
        },

        // Status
        LastStatus: {
            type: 'enum',
            values: ['SUCCESS', 'FAILURE', 'UNSTABLE']
        }
    };

    static relations = {
        // Relationships
        Project: {
            type: 'belongsTo',
            entity: 'project',
            foreignKey: 'Project'
        },

        // Relationships
        Builds: {
            type: 'hasMany',
            entity: 'build',
            foreignKey: 'BuildDefinition',
            inverseRef: true
        },

        // Collections
        Projects: {
            type: 'hasMany',
            entity: 'project',
            foreignKey: 'Projects',
            isCollection: true
        }
    };
}

export default BuildDefinition;

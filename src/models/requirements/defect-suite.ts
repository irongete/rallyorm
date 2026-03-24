import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { SchedulableArtifact } from '../base/schedulable-artifact.js';

/**
 * Defect-suite entity.
 *
 * Represents a schedulable grouping of related defects that can be managed,
 * prioritized, and planned together.
 */
export class DefectSuite extends SchedulableArtifact {
    static entityType = 'defectsuite';
    static isAbstract = false;

    static fields: Record<string, IFieldDefinition> = {
        ...SchedulableArtifact.fields,

        /**
         * Defects grouped in this suite
         */
        Defects: {
            type: 'array'
        },

        // Priority & Severity
        Priority: {
            type: 'enum',
            values: ['Critical', 'High', 'Normal', 'Low', 'None']
        },
        Severity: {
            type: 'enum',
            values: ['Critical', 'Major', 'Minor', 'Cosmetic', 'None']
        },

        // Metadata
        AIAssisted: {
            type: 'boolean'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...SchedulableArtifact.relations,

        Defects: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'DefectSuites',
            inverseRef: true
        }
    };
}

export default DefectSuite;

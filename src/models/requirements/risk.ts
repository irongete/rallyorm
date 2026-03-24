import { type IFieldDefinition, type IRelationDefinition } from '../base-entity.js';
import { Artifact } from '../base/artifact.js';

/**
 * Risk entity.
 *
 * Represents a project or portfolio risk tracked in Rally with probability,
 * impact, and mitigation data.
 */
export class Risk extends Artifact {
    static entityType = 'risk';
    static isAbstract = false;

    static fields: Record<string, IFieldDefinition> = {
        ...Artifact.fields,

        // Risk Assessment
        RiskLevel: {
            type: 'enum',
            values: ['High', 'Medium', 'Low']
        },
        Probability: {
            type: 'number',
            min: 0,
            max: 1
        },
        Impact: {
            type: 'number',
            min: 0,
            max: 1
        },
        CalculatedRisk: {
            type: 'number'
        },

        // Mitigation
        MitigationPlan: {
            type: 'string'
        },
        ContingencyPlan: {
            type: 'string'
        },

        // Status
        Status: {
            type: 'enum',
            values: ['Open', 'Mitigating', 'Mitigated', 'Accepted', 'Closed']
        },

        // Dates
        IdentifiedDate: {
            type: 'string'
        },
        ResolvedDate: {
            type: 'string'
        },

        // Associations
        Artifacts: {
            type: 'array'
        },
        Blocker: {
            type: 'object'
        },

        // Metadata
        AIAssisted: {
            type: 'boolean'
        }
    };

    static relations: Record<string, IRelationDefinition> = {
        ...Artifact.relations,

        Blocker: {
            type: 'belongsTo',
            entity: 'blocker',
            foreignKey: 'Blocker'
        }
    };
}

export default Risk;

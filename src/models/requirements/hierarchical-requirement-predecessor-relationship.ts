import { RallyEntity } from '../base-entity.js';

/**
 * Hierarchical-requirement-predecessor-relationship entity.
 *
 * Represents a dependency link between user stories so Rally can model story
 * predecessors and successors.
 */
export class HierarchicalRequirementPredecessorRelationship extends RallyEntity {
    static entityType = 'hierarchicalrequirementpredecessorrelationship';

    static fields = {
        // Dependency Link
        Predecessor: {
            type: 'object',
            required: true
            // Reference to UserStory that must complete first
        },
        Successor: {
            type: 'object',
            required: true
            // Reference to UserStory that depends on Predecessor
        },

        // Metadata
        CreationDate: {
            type: 'string'
        },
        ObjectID: {
            type: 'number'
        },
        _ref: {
            type: 'string'
        },
        _type: {
            type: 'string'
        }
    };

    static relations = {
        Predecessor: {
            type: 'belongsTo',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Predecessor'
        },
        Successor: {
            type: 'belongsTo',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Successor'
        }
    };
}

export default HierarchicalRequirementPredecessorRelationship;

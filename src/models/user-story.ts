import { SchedulableArtifact } from './base/schedulable-artifact.js';

/**
 * HierarchicalRequirement (User Story)
 *
 * User story record used to plan and track functional work in Rally.
 *
 * This model extends {@link SchedulableArtifact} with hierarchy, portfolio,
 * dependency, defect, and risk relationships that are specific to user-story
 * planning.
 */
export class UserStory extends SchedulableArtifact {
    static entityType = 'hierarchicalrequirement';
    static isAbstract = false;

    static fields = {
        ...SchedulableArtifact.fields,

        // Hierarchy
        /**
         * Indicates whether this story is nested under another user story.
         */
        HasParent: {
            type: 'boolean',
            readOnly: true
        },
        /**
         * Number of immediate child stories directly nested below this story.
         */
        DirectChildrenCount: {
            type: 'integer',
            readOnly: true
        },
        /**
         * Parent user story reference used to build the story hierarchy.
         */
        Parent: {
            type: 'ref',
            refType: 'HierarchicalRequirement',
            nullable: true
        },
        /**
         * Child user stories that descend directly from this story.
         */
        Children: {
            type: 'collection',
            refType: 'HierarchicalRequirement'
        },
        /**
         * Unified parent reference that may point to either a story or a portfolio item.
         */
        UnifiedParent: {
            type: 'ref',
            refType: 'Artifact',
            nullable: true
        },

        // Portfolio
        /**
         * Parent feature used to roll this story up into portfolio planning.
         */
        Feature: {
            type: 'ref',
            refType: 'PortfolioItem/Feature',
            nullable: true
        },

        // Dependencies
        /**
         * Predecessor dependency records that must complete before this story.
         */
        Predecessors: {
            type: 'collection',
            refType: 'HierarchicalRequirementPredecessorRelationship'
        },
        /**
         * Successor dependency records that depend on this story.
         */
        Successors: {
            type: 'collection',
            refType: 'HierarchicalRequirementPredecessorRelationship'
        },

        // Defects
        /**
         * Defects linked back to this story as the affected requirement.
         */
        Defects: {
            type: 'collection',
            refType: 'Defect'
        },
        /**
         * Read-only summary of the defect status rollup for this story.
         */
        DefectStatus: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Risks
        /**
         * Risks associated with this story as an artifact.
         */
        Risks: {
            type: 'collection',
            refType: 'Risk'
        },

        // Testing metrics
        /**
         * Total number of test cases attached directly to this story.
         */
        TotalDirectTestCaseCount: {
            type: 'integer',
            readOnly: true,
            nullable: true
        },
        /**
         * Number of directly attached test cases currently passing.
         */
        DirectPassingTestCaseCount: {
            type: 'integer',
            readOnly: true,
            nullable: true
        }
    };

    static relations = {
        ...SchedulableArtifact.relations,

        Parent: {
            type: 'belongsTo',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Parent'
        },
        Children: {
            type: 'hasMany',
            entity: 'hierarchicalrequirement',
            foreignKey: 'Parent',
            inverseRef: true
        },
        Feature: {
            type: 'belongsTo',
            entity: 'portfolioitem/feature',
            foreignKey: 'Feature'
        },
        Predecessors: {
            type: 'hasMany',
            entity: 'hierarchicalrequirementpredecessorrelationship',
            foreignKey: 'Successor',
            inverseRef: true
        },
        Successors: {
            type: 'hasMany',
            entity: 'hierarchicalrequirementpredecessorrelationship',
            foreignKey: 'Predecessor',
            inverseRef: true
        },
        Defects: {
            type: 'hasMany',
            entity: 'defect',
            foreignKey: 'Requirement',
            inverseRef: true
        },
        Risks: {
            type: 'hasMany',
            entity: 'risk',
            foreignKey: 'Artifact',
            inverseRef: true
        }
    };
}

export default UserStory;

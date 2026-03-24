import { SchedulableArtifact } from './base/schedulable-artifact.js';

/**
 * HierarchicalRequirement (User Story)
 *
 * User story record used to plan and track functional work in Rally.
 */
export class UserStory extends SchedulableArtifact {
    static entityType = 'hierarchicalrequirement';
    static isAbstract = false;

    static fields = {
        ...SchedulableArtifact.fields,

        // Hierarchy
        /**
         * Whether this story has a parent story
         */
        HasParent: {
            type: 'boolean',
            readOnly: true
        },
        /**
         * Number of direct child stories
         */
        DirectChildrenCount: {
            type: 'integer',
            readOnly: true
        },
        /**
         * Parent user story reference
         */
        Parent: {
            type: 'ref',
            refType: 'HierarchicalRequirement',
            nullable: true
        },
        /**
         * Child user stories collection
         */
        Children: {
            type: 'collection',
            refType: 'HierarchicalRequirement'
        },
        /**
         * Unified parent (can be story or portfolio item)
         */
        UnifiedParent: {
            type: 'ref',
            refType: 'Artifact',
            nullable: true
        },

        // Portfolio
        /**
         * Parent feature (portfolio item)
         */
        Feature: {
            type: 'ref',
            refType: 'PortfolioItem/Feature',
            nullable: true
        },

        // Dependencies
        /**
         * Predecessor stories
         */
        Predecessors: {
            type: 'collection',
            refType: 'HierarchicalRequirementPredecessorRelationship'
        },
        /**
         * Successor stories
         */
        Successors: {
            type: 'collection',
            refType: 'HierarchicalRequirementPredecessorRelationship'
        },

        // Defects
        /**
         * Associated defects
         */
        Defects: {
            type: 'collection',
            refType: 'Defect'
        },
        /**
         * Defect status summary
         */
        DefectStatus: {
            type: 'string',
            readOnly: true,
            nullable: true
        },

        // Risks
        /**
         * Associated risks
         */
        Risks: {
            type: 'collection',
            refType: 'Risk'
        },

        // Testing metrics
        /**
         * Total direct test cases count
         */
        TotalDirectTestCaseCount: {
            type: 'integer',
            readOnly: true,
            nullable: true
        },
        /**
         * Direct passing test case count
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

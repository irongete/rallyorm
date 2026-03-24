import { RallyEntity } from '../base-entity.js';

/**
 * PortfolioItemPredecessorRelationship
 *
 * Defines dependency relationships between portfolio items.
 * Manages predecessor-successor links for Features, Initiatives, Themes.
 */
export class PortfolioItemPredecessorRelationship extends RallyEntity {
    static entityType = 'portfolioitempredecessorrelationship';

    static fields = {
        Predecessor: {
            type: 'object',
            required: true
        },
        Successor: {
            type: 'object',
            required: true
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
            entity: 'portfolioitem',
            foreignKey: 'Predecessor'
        },
        Successor: {
            type: 'belongsTo',
            entity: 'portfolioitem',
            foreignKey: 'Successor'
        }
    };
}

export default PortfolioItemPredecessorRelationship;

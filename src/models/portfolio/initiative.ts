import { PortfolioItem } from '../base/portfolio-item.js';

/**
 * Initiative entity.
 *
 * Represents a high-level portfolio item used to group features under a major
 * business goal, investment, or program in Rally.
 */
export class Initiative extends PortfolioItem {
    static entityType = 'portfolioitem/initiative';
    static isAbstract = false;

    static fields = {
        ...PortfolioItem.fields
    };

    static relations = {
        ...PortfolioItem.relations
    };
}

export default Initiative;

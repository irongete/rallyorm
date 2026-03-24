import { PortfolioItem } from '../base/portfolio-item.js';

/**
 * Initiative
 *
 * Top-level strategic portfolio item. Initiatives contain Features as children
 * and represent major business goals or programs.
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

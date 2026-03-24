import { PortfolioItem } from './base/portfolio-item.js';

/**
 * Feature model.
 */
export class Feature extends PortfolioItem {
    static entityType = 'portfolioitem/feature';
    static isAbstract = false;

    static fields = {
        ...PortfolioItem.fields
    };

    static relations = {
        ...PortfolioItem.relations
    };
}

export default Feature;

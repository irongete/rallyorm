import { PortfolioItem } from '../base/portfolio-item.js';

/**
 * Theme
 *
 * Highest-level strategic portfolio item, above Initiatives.
 * Themes represent major strategic directions or business objectives.
 */
export class Theme extends PortfolioItem {
    static entityType = 'portfolioitem/theme';
    static isAbstract = false;

    static fields = {
        ...PortfolioItem.fields
    };

    static relations = {
        ...PortfolioItem.relations
    };
}

export default Theme;

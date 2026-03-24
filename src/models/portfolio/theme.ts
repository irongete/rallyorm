import { PortfolioItem } from '../base/portfolio-item.js';

/**
 * Theme entity.
 *
 * Represents the highest-level strategic portfolio grouping in Rally, used to
 * organize initiatives around broad business objectives.
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

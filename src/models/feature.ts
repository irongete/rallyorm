import { PortfolioItem } from './base/portfolio-item.js';

/**
 * Portfolio feature entity.
 *
 * Features represent higher-level deliverables used to group and prioritize
 * user stories within Rally's portfolio hierarchy. This model inherits the
 * common portfolio-item metadata, scheduling, and ranking fields from
 * {@link PortfolioItem}.
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

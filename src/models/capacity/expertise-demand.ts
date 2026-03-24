import { RallyEntity } from '../base-entity.js';

/**
 * ExpertiseDemand
 *
 * Demand for a specific expertise required by a portfolio item.
 */
export class ExpertiseDemand extends RallyEntity {
    static entityType = 'expertisedemand';
    static fields = {
        Name: { type: 'string' },
        Amount: { type: 'number' },
        PortfolioItem: { type: 'object' },
        CreationDate: { type: 'string' },
        ObjectID: { type: 'number' },
        _ref: { type: 'string' },
        _type: { type: 'string' }
    };
    static relations = {
        PortfolioItem: { type: 'belongsTo', entity: 'portfolioitem', foreignKey: 'PortfolioItem' }
    };
}

export default ExpertiseDemand;

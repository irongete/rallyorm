import { PortfolioItem } from '../base/portfolio-item.js';

/**
 * Objective model.
 */
export class Objective extends PortfolioItem {
    static entityType = 'objective';
    static isAbstract = false;

    static fields = {
        ...PortfolioItem.fields,

        // OKR Specifics
        KeyResults: {
            type: 'array'
        },
        Conversation: {
            type: 'array'
        }
    };

    static relations = {
        ...PortfolioItem.relations,
        KeyResults: {
            type: 'hasMany',
            entity: 'keyresult',
            foreignKey: 'Objective',
            inverseRef: true
        }
    };
}

export default Objective;

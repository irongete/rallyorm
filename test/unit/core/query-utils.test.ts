import { expect } from 'chai';
import { joinConditions } from '../../../src/core/query-utils.js';
import { rallyQueryParseError } from '../../setup/rally-query-grammar.js';

describe('joinConditions', () => {
    it('should return an empty string for no conditions', () => {
        expect(joinConditions([], 'AND')).to.equal('');
        expect(joinConditions(['', ''], 'OR')).to.equal('');
    });

    it('should return a single condition unchanged instead of double-wrapping it', () => {
        expect(joinConditions(['(A = 1)'], 'OR')).to.equal('(A = 1)');
    });

    it('should combine two conditions in one pair of parentheses', () => {
        expect(joinConditions(['(A = 1)', '(B = 2)'], 'AND')).to.equal('((A = 1) AND (B = 2))');
    });

    it('should nest three or more conditions pairwise, as Rally requires', () => {
        expect(joinConditions(['(A = 1)', '(B = 2)', '(C = 3)'], 'OR'))
            .to.equal('(((A = 1) OR (B = 2)) OR (C = 3))');
    });

    it('should produce a parseable query for a 50-condition chunk', () => {
        const conditions = Array.from({ length: 50 }, (_, i) => `(ObjectID = ${i + 1})`);
        expect(rallyQueryParseError(joinConditions(conditions, 'OR'))).to.equal(null);
    });
});

describe('rallyQueryParseError (test grammar)', () => {
    it('should accept the shapes Rally accepts', () => {
        expect(rallyQueryParseError('(A = 1)')).to.equal(null);
        expect(rallyQueryParseError('((A = 1) OR (B = "x y)"))')).to.equal(null);
        expect(rallyQueryParseError('(((A = 1) OR (B = 2)) AND (C != null))')).to.equal(null);
    });

    it('should reject the shapes Rally rejects', () => {
        expect(rallyQueryParseError('((A = 1) OR (B = 2) OR (C = 3))')).to.match(/expected "\)"/);
        expect(rallyQueryParseError('((A = 1))')).to.match(/expected AND\/OR/);
    });
});

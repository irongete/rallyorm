import { expect } from 'chai';
import {
    extractObjectIdFromRef,
    getEntityTypeFromRef,
    normalizeEntityType,
    isRallyRef,
    toAbsoluteRef,
    stripWsapiPrefix,
    toRelativeRef
} from '../../../src/core/ref-utils.js';

describe('ref-utils', () => {
    describe('extractObjectIdFromRef', () => {
        it('should extract ID from a relative ref', () => {
            expect(extractObjectIdFromRef('/defect/123')).to.equal('123');
        });

        it('should extract ID from an absolute WSAPI ref', () => {
            expect(extractObjectIdFromRef('https://rally1.rallydev.com/slm/webservice/v2.0/defect/456')).to.equal('456');
        });

        it('should return null for null input', () => {
            expect(extractObjectIdFromRef(null)).to.be.null;
        });

        it('should return null for undefined input', () => {
            expect(extractObjectIdFromRef(undefined)).to.be.null;
        });

        it('should return null for a ref without a numeric ID', () => {
            expect(extractObjectIdFromRef('/defect/abc')).to.be.null;
        });

        it('should return null for an empty string', () => {
            expect(extractObjectIdFromRef('')).to.be.null;
        });

        it('should extract ID from a portfolioitem ref', () => {
            expect(extractObjectIdFromRef('/portfolioitem/feature/999')).to.equal('999');
        });
    });

    describe('getEntityTypeFromRef', () => {
        it('should extract entity type from a relative ref', () => {
            expect(getEntityTypeFromRef('/defect/123')).to.equal('defect');
        });

        it('should extract entity type from an absolute WSAPI ref', () => {
            expect(getEntityTypeFromRef('https://rally1.rallydev.com/slm/webservice/v2.0/userstory/77')).to.equal('userstory');
        });

        it('should extract slash-delimited entity type for portfolio items', () => {
            expect(getEntityTypeFromRef('/portfolioitem/feature/42')).to.equal('portfolioitem/feature');
        });

        it('should return null for null input', () => {
            expect(getEntityTypeFromRef(null)).to.be.null;
        });

        it('should return null for a string that does not match the ref pattern', () => {
            expect(getEntityTypeFromRef('not-a-ref')).to.be.null;
        });

        it('should normalize entity type to lowercase', () => {
            expect(getEntityTypeFromRef('/HierarchicalRequirement/55')).to.equal('hierarchicalrequirement');
        });
    });

    describe('normalizeEntityType', () => {
        it('should lowercase and trim the entity type', () => {
            expect(normalizeEntityType('  HierarchicalRequirement  ')).to.equal('hierarchicalrequirement');
        });

        it('should return null for null input', () => {
            expect(normalizeEntityType(null)).to.be.null;
        });

        it('should return null for an empty string input', () => {
            expect(normalizeEntityType('')).to.be.null;
        });

        it('should return null for undefined', () => {
            expect(normalizeEntityType(undefined)).to.be.null;
        });

        it('should preserve slash separators in hierarchy', () => {
            expect(normalizeEntityType('PortfolioItem/Feature')).to.equal('portfolioitem/feature');
        });

        it('should strip a leading slash', () => {
            expect(normalizeEntityType('/defect')).to.equal('defect');
        });

        it('should return null when the string is all slashes', () => {
            expect(normalizeEntityType('/')).to.be.null;
        });
    });

    describe('isRallyRef', () => {
        it('should return true for a valid relative ref', () => {
            expect(isRallyRef('/defect/123')).to.equal(true);
        });

        it('should return true for a valid absolute WSAPI ref', () => {
            expect(isRallyRef('https://rally1.rallydev.com/slm/webservice/v2.0/task/88')).to.equal(true);
        });

        it('should return false for null', () => {
            expect(isRallyRef(null)).to.equal(false);
        });

        it('should return false for undefined', () => {
            expect(isRallyRef(undefined)).to.equal(false);
        });

        it('should return false for an arbitrary non-ref string', () => {
            expect(isRallyRef('not-a-ref')).to.equal(false);
        });

        it('should return false for a path without a numeric ID', () => {
            expect(isRallyRef('/defect/abc')).to.equal(false);
        });
    });

    describe('toAbsoluteRef', () => {
        it('should prepend baseUrl to a relative ref', () => {
            expect(toAbsoluteRef('/defect/123', 'https://rally1.rallydev.com/slm/webservice/v2.0'))
                .to.equal('https://rally1.rallydev.com/slm/webservice/v2.0/defect/123');
        });

        it('should return the relative ref unchanged when baseUrl is empty', () => {
            expect(toAbsoluteRef('/defect/123', '')).to.equal('/defect/123');
        });

        it('should return null for null input', () => {
            expect(toAbsoluteRef(null, 'https://host')).to.be.null;
        });

        it('should return undefined for undefined input', () => {
            expect(toAbsoluteRef(undefined, 'https://host')).to.be.undefined;
        });

        it('should return a non-relative string unchanged', () => {
            expect(toAbsoluteRef('already-absolute', 'https://host')).to.equal('already-absolute');
        });
    });

    describe('stripWsapiPrefix', () => {
        it('should return null for null input', () => {
            expect(stripWsapiPrefix(null)).to.be.null;
        });

        it('should return undefined for undefined input', () => {
            expect(stripWsapiPrefix(undefined)).to.be.undefined;
        });

        it('should strip the wsapi prefix from a full URL path', () => {
            expect(stripWsapiPrefix('/slm/webservice/v2.0/defect/123')).to.equal('/defect/123');
        });

        it('should return the original string when there is no wsapi prefix', () => {
            expect(stripWsapiPrefix('/defect/123')).to.equal('/defect/123');
        });
    });

    describe('toRelativeRef', () => {
        it('should return ref unchanged when it already starts with /', () => {
            expect(toRelativeRef('/defect/123')).to.equal('/defect/123');
        });

        it('should strip wsapi prefix from an absolute URL', () => {
            expect(toRelativeRef('https://rally1.rallydev.com/slm/webservice/v2.0/defect/123')).to.equal('/defect/123');
        });

        it('should use baseUrl to strip prefix when URL parsing fails', () => {
            const result = toRelativeRef('https://custom-host.example.com/defect/456', 'https://custom-host.example.com');
            expect(result).to.equal('/defect/456');
        });

        it('should return the original ref when it cannot be made relative', () => {
            expect(toRelativeRef('not-a-url-or-path')).to.equal('not-a-url-or-path');
        });

        it('should return null for null input', () => {
            expect(toRelativeRef(null)).to.be.null;
        });
    });
});

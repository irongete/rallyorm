import { expect } from 'chai';
import { readFileSync } from 'node:fs';

describe('README', () => {
    it('should not contain patch markers or embedded file diffs', () => {
        const readme = readFileSync(new URL('../../../README.md', import.meta.url), 'utf8');

        expect(readme).to.not.include('*** Begin Patch');
        expect(readme).to.not.include('*** End Patch');
        expect(readme).to.not.include('*** Add File:');
        expect(readme).to.not.include('*** Update File:');
        expect(readme).to.not.include('*** Delete File:');
    });
});
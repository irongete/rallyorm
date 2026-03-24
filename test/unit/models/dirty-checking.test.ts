import { expect } from 'chai';
import { RallyEntity } from '../../../src/models/base-entity.js';

describe('RallyEntity Dirty Checking', () => {
    it('should detect no changes initially', () => {
        const entity = new RallyEntity({ Name: 'Test', State: 'Open' });
        expect(entity.getChanges()).to.deep.equal({});
    });

    it('should detect simple property change', () => {
        const entity = new RallyEntity({ Name: 'Test', State: 'Open' });
        entity.Name = 'New Name';
        expect(entity.getChanges()).to.deep.equal({ Name: 'New Name' });
    });

    it('should not report change if value is same', () => {
        const entity = new RallyEntity({ Name: 'Test', State: 'Open' });
        entity.Name = 'Test';
        expect(entity.getChanges()).to.deep.equal({});
    });

    it('should commit changes', () => {
        const entity = new RallyEntity({ Name: 'Test', State: 'Open' });
        entity.Name = 'New Name';
        expect(entity.getChanges()).to.deep.equal({ Name: 'New Name' });

        entity.commit();
        expect(entity.getChanges()).to.deep.equal({});
        expect(entity.Name).to.equal('New Name');
    });

    it('should handle object comparisons', () => {
        const project = { _ref: '/project/1', Name: 'P1' };
        const entity = new RallyEntity({ Name: 'Test', Project: project });

        entity.Project = { _ref: '/project/1', Name: 'P1' };
        expect(entity.getChanges()).to.deep.equal({});

        entity.Project = { _ref: '/project/2', Name: 'P2' };
        expect(entity.getChanges()).to.deep.equal({ Project: { _ref: '/project/2', Name: 'P2' } });
    });

    it('should detect nested object and array mutations', () => {
        const entity = new RallyEntity({
            Settings: { mode: 'safe', flags: ['a'] },
            Items: [{ ObjectID: 1, Name: 'Original' }]
        });

        entity.Settings.mode = 'strict';
        entity.Settings.flags.push('b');
        entity.Items[0].Name = 'Updated';

        expect(entity.getChanges()).to.deep.equal({
            Settings: { mode: 'strict', flags: ['a', 'b'] },
            Items: [{ ObjectID: 1, Name: 'Updated' }]
        });
    });
});

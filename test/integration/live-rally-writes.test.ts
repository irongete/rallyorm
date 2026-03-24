import { expect } from 'chai';

import Defect from '../../src/models/defect.js';
import { createWritableIntegrationDataSource, getWriteIntegrationSkipReason, loadIntegrationConfig } from '../setup/integration-helpers.js';

const config = loadIntegrationConfig();
const skipReason = getWriteIntegrationSkipReason(config);
const describeLiveWrites = skipReason ? describe.skip : describe;

describeLiveWrites('Live Rally Write Integration', function () {
    this.timeout(60000);

    const dataSource = createWritableIntegrationDataSource(config);
    const defects = dataSource.getRepository(Defect);

    it('should create, update and delete a sandbox defect', async () => {
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const created = await defects.create({
            Name: `RallyORM live release validation ${suffix}`,
            Description: 'Created by the live release gate. Safe to delete.',
            Project: { _ref: `/project/${config.testProjectOid}` },
            Priority: 'Normal'
        });

        expect(created.ObjectID).to.not.equal(undefined);
        expect(created.Name).to.contain(suffix);

        const updated = await defects.update(created.ObjectID, {
            Description: `Updated by RallyORM live release validation ${suffix}`,
            Severity: 'Major Problem'
        });

        expect(updated.ObjectID).to.equal(created.ObjectID);

        const reloaded = await defects.findOne(created.ObjectID, {
            fetch: ['ObjectID', 'Name', 'Description', 'Project.ObjectID']
        });

        expect(reloaded).to.not.equal(null);
        expect(reloaded?.Description).to.contain(suffix);
        expect(String(reloaded?.Project?.ObjectID ?? '')).to.equal(String(config.testProjectOid));

        const deleted = await defects.delete(created.ObjectID);
        expect(deleted).to.equal(true);
    });
});

describe('Live Rally Write Integration Configuration', () => {
    it('documents how to enable the live write suite', function () {
        if (!skipReason) {
            this.skip();
        }

        expect(skipReason).to.be.a('string');
    });
});
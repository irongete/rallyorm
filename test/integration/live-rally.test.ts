import { expect } from 'chai';

import { RallyDataSource } from '../../src/core/rally-datasource.js';

import { createIntegrationDataSource, getIntegrationSkipReason, loadIntegrationConfig } from '../setup/integration-helpers.js';

const config = loadIntegrationConfig();
const skipReason = getIntegrationSkipReason(config);
const describeLive = skipReason ? describe.skip : describe;

describeLive('Live Rally Integration', function () {
    this.timeout(30000);

    let ds: RallyDataSource;

    before(async () => {
        ds = createIntegrationDataSource(config);
    });

    it('should query projects in read-only mode', async () => {
        const projects = await ds.projects.find({
            select: ['ObjectID', 'Name'],
            order: 'Name',
            pagesize: 3
        });

        expect(projects).to.be.an('array');

        for (const project of projects) {
            expect(project.ObjectID).to.not.equal(undefined);
            expect(project.Name).to.be.a('string');
        }
    });
});

describe('Live Rally Integration Configuration', () => {
    it('documents how to enable the live suite', function () {
        if (!skipReason) {
            this.skip();
        }

        expect(skipReason).to.be.a('string');
    });
});
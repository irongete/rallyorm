import { expect } from 'chai';

import { RallyDataSource } from '../../src/core/rally-datasource.js';
import { TestCase } from '../../src/models/core/test-case.js';
import { HierarchicalRequirement as UserStory } from '../../src/models/core/hierarchical-requirement.js';
import { createIntegrationDataSource, getIntegrationSkipReason, loadIntegrationConfig } from '../setup/integration-helpers.js';

const config = loadIntegrationConfig();
const suiteSkipReason = getIntegrationSkipReason(config);
const describeLive = suiteSkipReason ? describe.skip : describe;

describeLive('Live Rally Fixture-Backed Integration', function () {
    this.timeout(30000);

    let ds: RallyDataSource;

    before(() => {
        ds = createIntegrationDataSource(config);
    });

    (config.testUserStoryOid ? it : it.skip)('should load a configured user story with nested relations', async () => {
        const story = await ds.getRepository(UserStory).findOne(config.testUserStoryOid as string, {
            fetch: [
                'ObjectID',
                'Name',
                'Project.Name',
                'Owner.DisplayName',
                'Feature.Name'
            ]
        });

        expect(story).to.not.equal(null);
        expect(story?.ObjectID).to.not.equal(undefined);
        expect(story?.Name).to.be.a('string');

        if (story?.Project) {
            expect(story.Project.Name).to.be.a('string');
        }

        if (story?.Owner) {
            expect(story.Owner.DisplayName).to.be.a('string');
        }

        if (story?.Feature) {
            expect(story.Feature.Name).to.be.a('string');
        }
    });

    (config.testTestCaseOid ? it : it.skip)('should load a configured test case with artifact-compatible relationships', async () => {
        const testCase = await ds.getRepository(TestCase).findOne(config.testTestCaseOid as string, {
            fetch: [
                'ObjectID',
                'Name',
                'WorkProduct.Name',
                'LastResult.ObjectID'
            ]
        });

        expect(testCase).to.not.equal(null);
        expect(testCase?.ObjectID).to.not.equal(undefined);
        expect(testCase?.Name).to.be.a('string');

        if (testCase?.WorkProduct) {
            expect(testCase.WorkProduct.Name).to.be.a('string');
        }

        if (testCase?.LastResult) {
            expect(testCase.LastResult.ObjectID).to.not.equal(undefined);
        }
    });
});
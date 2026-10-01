import { expect } from 'chai';

import { RallyDataSource } from '../../src/core/rally-datasource.js';
import { RallyOperationError } from '../../src/core/errors.js';

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

    describe('query building against the real Rally parser', () => {
        it('should combine three or more AND/OR terms in a form Rally accepts', async () => {
            const stories = await ds.userStories.findAllBy({ select: ['FormattedID', 'ScheduleState'], maxResults: 3 });
            expect(stories.length, 'workspace needs at least 3 user stories').to.equal(3);
            const ids = stories.map(story => story.FormattedID);

            const viaIn = await ds.userStories.findAllBy({ where: { FormattedID: { $in: ids } }, select: ['FormattedID'] });
            const viaOr = await ds.userStories.findAllBy({ where: { $or: ids.map(id => ({ FormattedID: id })) }, select: ['FormattedID'] });
            const viaAnd = await ds.userStories.findAllBy({
                where: { FormattedID: ids[0], ScheduleState: stories[0].ScheduleState, Name: { $ne: null } },
                select: ['FormattedID']
            });

            expect(viaIn.map(story => story.FormattedID)).to.have.members(ids);
            expect(viaOr.map(story => story.FormattedID)).to.have.members(ids);
            expect(viaAnd.map(story => story.FormattedID)).to.deep.equal([ids[0]]);
        });

        it('should throw when Rally rejects a query instead of returning nothing', async () => {
            try {
                await ds.userStories.find({ query: '((Name != null) OR (Name = "a") OR (Name = "b"))' });
                expect.fail('Expected the malformed query to throw');
            } catch (error: any) {
                expect(error).to.be.instanceOf(RallyOperationError);
                expect(error.rallyErrors.join(' ')).to.match(/Could not parse/);
            }
        });
    });

    it('should validate entities exactly as Rally returns them', async () => {
        const repositories = [ds.defects, ds.userStories, ds.testCases, ds.testSets, ds.iterations, ds.releases, ds.users] as const;
        const failures: string[] = [];

        for (const repository of repositories) {
            const entities = await repository.findAllBy({ select: ['*'], maxResults: 50 });
            for (const entity of entities) {
                if (!entity.validate()) {
                    failures.push(`${repository.entityType} ${entity._data.ObjectID}: ${entity.getErrors().join('; ')}`);
                }
            }
        }

        expect(failures, failures.slice(0, 5).join('\n')).to.deep.equal([]);
    });

    describe('paging and nested selects', () => {
        let requests: string[];

        beforeEach(() => {
            requests = [];
            const realFetch = globalThis.fetch;
            ds.client.setFetch((input, init) => {
                requests.push(new URL(String(input)).pathname.replace(/^.*\/v2\.0\//, ''));
                return realFetch(input, init);
            });
        });

        it('should page find() up to maxResults', async () => {
            const testCases = await ds.testCases.find({ select: ['FormattedID'], maxResults: 6, pagesize: 2 });
            expect(testCases).to.have.length(6);
            expect(requests).to.have.length(3);
        });

        it('should read single related objects filled in place without extra requests', async () => {
            const stories = await ds.userStories.findAllBy({ select: ['FormattedID', 'Owner.DisplayName', 'Iteration.Project.Name'] });

            expect(requests).to.have.length(1);
            for (const story of stories.filter(story => story.Owner)) {
                expect(story.Owner.DisplayName).to.be.a('string');
            }
            for (const story of stories.filter(story => story.Iteration)) {
                expect(story.Iteration.Project.Name).to.be.a('string');
            }
        });
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
import { expect } from 'chai';
import { LazyLink } from '../../../src/core/lazy-link.js';
import { RallyEntity } from '../../../src/models/base-entity.js';
import { RallyValidationError } from '../../../src/core/errors.js';
import { RallyDataSource } from '../../../src/core/rally-datasource.js';

describe('Lazy Loading', () => {

    describe('LazyLink', () => {
        it('should initialize with data', () => {
            const link = new LazyLink({ _ref: '/story/1', Name: 'S1' }, null);
            expect(link._ref).to.equal('/story/1');
            expect(link.Name).to.equal('S1');
        });

        it('should hide _dataSource property', () => {
            const link = new LazyLink({}, { getRepository: () => ({ findOne: async () => null }) } as any);
            const keys = Object.keys(link);
            expect(keys).to.not.include('_dataSource');
        });

        it('should throw RallyValidationError when load() is called with no _ref', async () => {
            const link = new LazyLink({}, { getRepository: () => ({ findOne: async () => null }) } as any);
            try {
                await link.load();
                expect.fail('Expected load() to throw');
            } catch (error: any) {
                expect(error).to.be.instanceOf(RallyValidationError);
                expect(error.message).to.include('_ref is missing');
            }
        });

        it('should throw RallyValidationError when load() is called with no dataSource', async () => {
            const link = new LazyLink({ _ref: '/story/1' }, null);
            try {
                await link.load();
                expect.fail('Expected load() to throw');
            } catch (error: any) {
                expect(error).to.be.instanceOf(RallyValidationError);
                expect(error.message).to.include('no dataSource context');
            }
        });

        it('should load entity using dataSource', async () => {
            const mockRepo = {
                findOne: async (ref: string) => new RallyEntity({ _ref: ref, Name: 'Loaded' })
            };
            const mockDataSource = {
                getRepository: (type: string) => {
                    expect(type).to.equal('story');
                    return mockRepo;
                }
            };

            const link = new LazyLink({ _ref: '/story/123' }, mockDataSource as any);
            const loaded = await link.load();

            expect(loaded?.toJSON()).to.deep.equal({ _ref: '/story/123', Name: 'Loaded' });
        });

        it('should resolve slash-delimited entity types during load', async () => {
            const mockRepo = {
                findOne: async (ref: string) => new RallyEntity({ _ref: ref, Name: 'Loaded Feature' })
            };
            const mockDataSource = {
                getRepository: (type: string) => {
                    expect(type).to.equal('portfolioitem/feature');
                    return mockRepo;
                }
            };

            const link = new LazyLink({ _ref: '/portfolioitem/feature/123' }, mockDataSource as any);
            const loaded = await link.load();

            expect(loaded?.toJSON()).to.deep.equal({ _ref: '/portfolioitem/feature/123', Name: 'Loaded Feature' });
        });
    });

    describe('RallyEntity Integration', () => {
        it('should return LazyLink for relationships with _ref', () => {
            const mockDataSource = { getRepository: () => ({ findOne: async () => null }) };
            const context = { dataSource: mockDataSource };

            class TestStory extends RallyEntity {
                static relations = {
                    Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
                };
            }

            const data = {
                Name: 'Story 1',
                Project: { _ref: '/project/999', Name: 'Project X' }
            };

            const story = new TestStory(data, context as any);

            const projectLink = story.Project;

            expect(projectLink).to.be.instanceOf(LazyLink);
            expect(projectLink._ref).to.equal('/project/999');
            expect(projectLink.Name).to.equal('Project X');
            expect(typeof projectLink.load).to.equal('function');
        });

        it('should return regular value if no _ref', () => {
            const context = { dataSource: { getRepository: () => ({ findOne: async () => null }) } };
            class TestStory extends RallyEntity {
                static relations = {
                    Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
                };
            }
            const data = { Project: { Name: 'Just Name' } };
            const story = new TestStory(data, context as any);

            expect(story.Project).to.not.be.instanceOf(LazyLink);
            expect(story.Project).to.deep.equal({ Name: 'Just Name' });
        });

        it('should return regular value if no context', () => {
            class TestStory extends RallyEntity {
                static relations = {
                    Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
                };
            }
            const data = { Project: { _ref: '/p/1' } };
            const story = new TestStory(data);

            expect(story.Project).to.not.be.instanceOf(LazyLink);
        });

        it('should seed LazyLink with relation entity metadata when _type is missing', async () => {
            const mockRepo = {
                findOne: async (ref: string) => new RallyEntity({ _ref: ref, Name: 'Feature 1' })
            };
            const context = {
                dataSource: {
                    getRepository: (type: string) => {
                        expect(type).to.equal('portfolioitem/feature');
                        return mockRepo;
                    }
                }
            };

            class TestStory extends RallyEntity {
                static relations = {
                    Feature: { type: 'belongsTo', entity: 'portfolioitem/feature', foreignKey: 'Feature' }
                };
            }

            const story = new TestStory({ Feature: { _ref: '/portfolioitem/feature/1' } }, context as any);
            const featureLink = story.Feature as LazyLink;

            expect(featureLink).to.be.instanceOf(LazyLink);
            expect(featureLink._type).to.equal('portfolioitem/feature');
            expect((await featureLink.load())?.toJSON()).to.deep.equal({ _ref: '/portfolioitem/feature/1', Name: 'Feature 1' });
        });

        it('should return data without _dataSource from toJSON', () => {
            const dataSource = { getRepository: () => ({ findOne: async () => null }) } as any;
            const link = new LazyLink({ _ref: '/story/1', Name: 'Test' }, dataSource);

            const json = link.toJSON();

            expect(json).to.not.have.property('_dataSource');
            expect(json._ref).to.equal('/story/1');
            expect(json.Name).to.equal('Test');
        });

        it('should return null from load when entity type cannot be resolved from the ref', async () => {
            const dataSource = { getRepository: () => ({ findOne: async () => null }) } as any;
            // Use a ref that has no recognizable entity type segment
            const link = new LazyLink({ _ref: '/notvalid' }, dataSource);

            const result = await link.load();

            expect(result).to.be.null;
        });

        it('should re-throw and log with error argument when repository throws during load', async () => {
            const loadError = new Error('load failed');
            const loggedErrors: unknown[] = [];

            const dataSource = {
                client: {
                    logger: {
                        warn: () => {},
                        error: (_msg: string, err: unknown) => { loggedErrors.push(err); }
                    }
                },
                getRepository: () => ({
                    findOne: async () => { throw loadError; }
                })
            } as any;

            const link = new LazyLink({ _ref: '/story/1', _type: 'story' }, dataSource);

            try {
                await link.load();
                expect.fail('Expected load to throw');
            } catch (thrown: any) {
                expect(thrown).to.equal(loadError);
                expect(loggedErrors).to.have.length(1);
                expect(loggedErrors[0]).to.be.instanceOf(Error);
            }
        });
    });

    describe('End to end through a real datasource', () => {
        it('should GET /<type>/<ObjectID> when loading a LazyLink that carries an absolute ref', async () => {
            // Regression: load() forwarded the whole ref to findOne(), which appended it to the
            // entity path and produced `/project/https://…/project/42` (HTTP 404) against Rally.
            const urls: string[] = [];
            const fetch = async (url: RequestInfo | URL): Promise<Response> => {
                const plain = String(url).replace(/\?.*$/, '');
                urls.push(plain);
                const body = plain.endsWith('/project/42')
                    ? { Project: { _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/project/42', ObjectID: 42, Name: 'Loaded project' } }
                    : { QueryResult: { Results: [{ _ref: '/hierarchicalrequirement/1', ObjectID: 1, Name: 'Story', Project: { _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/project/42', _type: 'Project' } }] } };
                return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
            };

            const ds = new RallyDataSource({ apiKey: 'test-key', logLevel: 'silent', fetch });
            const [story] = await ds.userStories.find({ select: ['Name'] });

            expect(story.Project).to.be.instanceOf(LazyLink);
            const project = await story.Project.load();

            expect(urls[urls.length - 1]).to.equal('https://rally1.rallydev.com/slm/webservice/v2.0/project/42');
            expect(project?.Name).to.equal('Loaded project');
            expect(project?.ObjectID).to.equal(42);
        });
    });
});

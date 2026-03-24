import { expect } from 'chai';
import { RallyClient } from '../../../src/core/rally-client.js';
import { RelationshipLoader } from '../../../src/core/relationship-loader.js';
import { RallyEntity } from '../../../src/models/base-entity.js';
import { createMockClient } from '../../setup/test-helpers.js';

async function withEnv<T>(values: Record<string, string | undefined>, callback: () => Promise<T> | T): Promise<T> {
    const originalValues = new Map<string, string | undefined>();

    for (const [key, value] of Object.entries(values)) {
        originalValues.set(key, process.env[key]);

        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }

    try {
        return await callback();
    } finally {
        for (const [key, value] of originalValues.entries()) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    }
}

describe('RelationshipLoader', () => {
    it('should load nested belongsTo relationships for slash-delimited entity types', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Feature: { type: 'belongsTo', entity: 'portfolioitem/feature', foreignKey: 'Feature' }
            };
        }

        class FeatureModel extends RallyEntity {
            static entityType = 'portfolioitem/feature';
            static relations = {
                Owner: { type: 'belongsTo', entity: 'user', foreignKey: 'Owner' }
            };
        }

        class UserModel extends RallyEntity {
            static entityType = 'user';
            static relations = {};
        }

        const client = createMockClient({
            queryAll: async (entityType: string, options: { query?: string }) => {
                if (entityType === 'portfolioitem/feature') {
                    expect(options.query).to.include('(ObjectID = 42)');
                    return [{
                        _ref: '/portfolioitem/feature/42',
                        _type: 'portfolioitem/feature',
                        Name: 'Feature 42',
                        Owner: { _ref: '/user/7' }
                    }];
                }

                if (entityType === 'user') {
                    expect(options.query).to.include('(ObjectID = 7)');
                    return [{
                        _ref: '/user/7',
                        _type: 'user',
                        DisplayName: 'Ada Lovelace'
                    }];
                }

                return [];
            }
        });

        const loader = new RelationshipLoader(client as any);
        const story = new Story({
            _ref: '/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement',
            Feature: { _ref: '/portfolioitem/feature/42' }
        });

        await loader.loadRelationships(story, ['Feature.Owner'], {
            hierarchicalrequirement: Story,
            'portfolioitem/feature': FeatureModel,
            user: UserModel
        });

        expect(story._data.Feature).to.include({ _ref: '/portfolioitem/feature/42', Name: 'Feature 42' });
        expect(story._data.Feature.Owner).to.include({ _ref: '/user/7', DisplayName: 'Ada Lovelace' });
    });

    it('should normalize single absolute refs in inverse relationship queries', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Tasks: { type: 'hasMany', entity: 'task', foreignKey: 'WorkProduct', inverseRef: true }
            };
        }

        class TaskModel extends RallyEntity {
            static entityType = 'task';
            static relations = {};
        }

        const client = createMockClient({
            queryAll: async (entityType: string, options: { query?: string }) => {
                expect(entityType).to.equal('task');
                expect(options.query).to.equal('(WorkProduct = "/hierarchicalrequirement/1")');
                return [{
                    _ref: '/task/10',
                    _type: 'task',
                    Name: 'Task 10',
                    WorkProduct: { _ref: '/hierarchicalrequirement/1' }
                }];
            }
        });

        const loader = new RelationshipLoader(client as any);
        const story = new Story({
            _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement'
        });

        await loader.loadRelationships(story, ['Tasks'], {
            hierarchicalrequirement: Story,
            task: TaskModel
        });

        expect(story._data.Tasks).to.have.length(1);
        expect(story._data.Tasks[0]).to.include({ _ref: '/task/10', Name: 'Task 10' });
    });

    it('should load generic Rally collection refs using the relation field name first', async () => {
        class ProjectModel extends RallyEntity {
            static entityType = 'project';
            static relations = {
                TeamMembers: { type: 'hasMany', entity: 'user', foreignKey: 'TeamMemberships', isCollection: true }
            };
        }

        const client = createMockClient({
            queryCollectionAll: async (ref: string, options: { fetch?: string }) => {
                expect(ref).to.equal('/project/1/TeamMembers');
                expect(options.fetch).to.equal('ObjectID,DisplayName');
                return [
                    { _ref: '/user/2', _type: 'user', ObjectID: 2, DisplayName: 'Grace Hopper' }
                ];
            }
        });

        const loader = new RelationshipLoader(client as any);
        const project = new ProjectModel({
            _ref: '/project/1',
            _type: 'project',
            TeamMembers: { _ref: '/project/1/TeamMembers', Count: 1 }
        });

        await loader.loadRelationships(project, ['TeamMembers.DisplayName'], {
            project: ProjectModel,
            user: RallyEntity
        });

        expect(project._data.TeamMembers).to.have.length(1);
        expect(project._data.TeamMembers[0]).to.include({ _ref: '/user/2', DisplayName: 'Grace Hopper' });
    });

    it('should use queryAll for inverse relationships so large result sets are not truncated', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Tasks: { type: 'hasMany', entity: 'task', foreignKey: 'WorkProduct', inverseRef: true }
            };
        }

        const client = createMockClient({
            query: async () => {
                throw new Error('query should not be used for inverse relation loading');
            },
            queryAll: async (_entityType: string, options: { query?: string }) => {
                expect(options.query).to.equal('(WorkProduct = "/hierarchicalrequirement/1")');
                return [
                    { _ref: '/task/10', _type: 'task', Name: 'Task 10', WorkProduct: { _ref: '/hierarchicalrequirement/1' } },
                    { _ref: '/task/11', _type: 'task', Name: 'Task 11', WorkProduct: { _ref: '/hierarchicalrequirement/1' } }
                ];
            }
        });

        const loader = new RelationshipLoader(client as any);
        const story = new Story({
            _ref: '/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement'
        });

        await loader.loadRelationships(story, ['Tasks'], {
            hierarchicalrequirement: Story,
            task: RallyEntity
        });

        expect(story._data.Tasks).to.have.length(2);
    });

    it('should deduplicate inverse relation refs before building the query', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Tasks: { type: 'hasMany', entity: 'task', foreignKey: 'WorkProduct', inverseRef: true }
            };
        }

        const client = createMockClient({
            queryAll: async (_entityType: string, options: { query?: string }) => {
                expect(options.query).to.equal('(WorkProduct = "/hierarchicalrequirement/1")');
                return [];
            }
        });

        const loader = new RelationshipLoader(client as any);
        const story = new Story({
            _ref: '/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement'
        });

        await loader.loadRelationships([story, story], ['Tasks'], {
            hierarchicalrequirement: Story,
            task: RallyEntity
        });

        expect(story._data.Tasks).to.deep.equal([]);
    });

    it('should keep tag shortcut handling for tag collections', async () => {
        class ArtifactModel extends RallyEntity {
            static entityType = 'artifact';
            static relations = {
                Tags: { type: 'hasMany', entity: 'tag', foreignKey: 'Tags', isCollection: true }
            };
        }

        const client = createMockClient({
            query: async (entityType: string, options: { query?: string }) => {
                expect(entityType).to.equal('tag');
                expect(options.query).to.include('Backend');
                return [{ _ref: '/tag/1', _type: 'tag', Name: 'Backend' }];
            }
        });

        const loader = new RelationshipLoader(client as any);
        const artifact = new ArtifactModel({
            _ref: '/artifact/1',
            _type: 'artifact',
            Tags: { _tagsNameArray: ['Backend'] }
        });

        await loader.loadRelationships(artifact, ['Tags'], {
            artifact: ArtifactModel
        });

        expect(artifact._data.Tags).to.have.length(1);
        expect(artifact._data.Tags[0]).to.include({ _ref: '/tag/1', Name: 'Backend' });
    });

    it('should load independent collection relationships in parallel', async () => {
        class ProjectModel extends RallyEntity {
            static entityType = 'project';
            static relations = {
                TeamMembers: { type: 'hasMany', entity: 'user', foreignKey: 'TeamMemberships', isCollection: true }
            };
        }

        let activeRequests = 0;
        let peakConcurrency = 0;

        const client = createMockClient({
            queryCollectionAll: async (ref: string) => {
                activeRequests += 1;
                peakConcurrency = Math.max(peakConcurrency, activeRequests);

                await new Promise(resolve => setTimeout(resolve, 10));

                activeRequests -= 1;

                return [{ _ref: `${ref}/user/1`, _type: 'user', DisplayName: 'Parallel User' }];
            }
        });

        const loader = new RelationshipLoader(client as any);
        const projects = [
            new ProjectModel({
                _ref: '/project/1',
                _type: 'project',
                TeamMembers: { _ref: '/project/1/TeamMembers', Count: 1 }
            }),
            new ProjectModel({
                _ref: '/project/2',
                _type: 'project',
                TeamMembers: { _ref: '/project/2/TeamMembers', Count: 1 }
            })
        ];

        await loader.loadRelationships(projects, ['TeamMembers.DisplayName'], {
            project: ProjectModel,
            user: RallyEntity
        });

        expect(peakConcurrency).to.be.greaterThan(1);
        expect(projects[0]._data.TeamMembers).to.have.length(1);
        expect(projects[1]._data.TeamMembers).to.have.length(1);
    });

    it('should respect RALLY_MAX_CONCURRENT_REQUESTS during parallel relationship loading', async () => {
        class ProjectModel extends RallyEntity {
            static entityType = 'project';
            static relations = {
                TeamMembers: { type: 'hasMany', entity: 'user', foreignKey: 'TeamMemberships', isCollection: true }
            };
        }

        await withEnv({
            RALLY_MAX_CONCURRENT_REQUESTS: '1'
        }, async () => {
            let activeRequests = 0;
            let peakConcurrency = 0;

            const client = new RallyClient({
                apiKey: 'test-key',
                logLevel: 'silent',
                fetch: async (url) => {
                    activeRequests += 1;
                    peakConcurrency = Math.max(peakConcurrency, activeRequests);

                    await new Promise(resolve => setTimeout(resolve, 10));

                    activeRequests -= 1;

                    const ref = new URL(String(url)).pathname.replace('/slm/webservice/v2.0', '');

                    return {
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null, getSetCookie: () => [] },
                        text: async () => JSON.stringify({
                            QueryResult: {
                                Results: [{ _ref: `${ref}/user/1`, _type: 'user', DisplayName: 'Queued User' }],
                                TotalResultCount: 1
                            }
                        })
                    } as unknown as Response;
                }
            });

            const loader = new RelationshipLoader(client);
            const projects = [
                new ProjectModel({
                    _ref: '/project/1',
                    _type: 'project',
                    TeamMembers: { _ref: '/project/1/TeamMembers', Count: 1 }
                }),
                new ProjectModel({
                    _ref: '/project/2',
                    _type: 'project',
                    TeamMembers: { _ref: '/project/2/TeamMembers', Count: 1 }
                }),
                new ProjectModel({
                    _ref: '/project/3',
                    _type: 'project',
                    TeamMembers: { _ref: '/project/3/TeamMembers', Count: 1 }
                })
            ];

            await loader.loadRelationships(projects, ['TeamMembers.DisplayName'], {
                project: ProjectModel,
                user: RallyEntity
            });

            expect(peakConcurrency).to.equal(1);
            expect(projects[0]._data.TeamMembers).to.have.length(1);
            expect(projects[1]._data.TeamMembers).to.have.length(1);
            expect(projects[2]._data.TeamMembers).to.have.length(1);
        });
    });

    it('should use available parallelism without exceeding RALLY_MAX_CONCURRENT_REQUESTS', async () => {
        class ProjectModel extends RallyEntity {
            static entityType = 'project';
            static relations = {
                TeamMembers: { type: 'hasMany', entity: 'user', foreignKey: 'TeamMemberships', isCollection: true }
            };
        }

        await withEnv({
            RALLY_MAX_CONCURRENT_REQUESTS: '2'
        }, async () => {
            let activeRequests = 0;
            let peakConcurrency = 0;

            const client = new RallyClient({
                apiKey: 'test-key',
                logLevel: 'silent',
                fetch: async (url) => {
                    activeRequests += 1;
                    peakConcurrency = Math.max(peakConcurrency, activeRequests);

                    await new Promise(resolve => setTimeout(resolve, 10));

                    activeRequests -= 1;

                    const ref = new URL(String(url)).pathname.replace('/slm/webservice/v2.0', '');

                    return {
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null, getSetCookie: () => [] },
                        text: async () => JSON.stringify({
                            QueryResult: {
                                Results: [{ _ref: `${ref}/user/1`, _type: 'user', DisplayName: 'Queued User' }],
                                TotalResultCount: 1
                            }
                        })
                    } as unknown as Response;
                }
            });

            const loader = new RelationshipLoader(client);
            const projects = [
                new ProjectModel({
                    _ref: '/project/1',
                    _type: 'project',
                    TeamMembers: { _ref: '/project/1/TeamMembers', Count: 1 }
                }),
                new ProjectModel({
                    _ref: '/project/2',
                    _type: 'project',
                    TeamMembers: { _ref: '/project/2/TeamMembers', Count: 1 }
                }),
                new ProjectModel({
                    _ref: '/project/3',
                    _type: 'project',
                    TeamMembers: { _ref: '/project/3/TeamMembers', Count: 1 }
                }),
                new ProjectModel({
                    _ref: '/project/4',
                    _type: 'project',
                    TeamMembers: { _ref: '/project/4/TeamMembers', Count: 1 }
                })
            ];

            await loader.loadRelationships(projects, ['TeamMembers.DisplayName'], {
                project: ProjectModel,
                user: RallyEntity
            });

            expect(peakConcurrency).to.be.greaterThan(1);
            expect(peakConcurrency).to.be.at.most(2);
            expect(projects[0]._data.TeamMembers).to.have.length(1);
            expect(projects[1]._data.TeamMembers).to.have.length(1);
            expect(projects[2]._data.TeamMembers).to.have.length(1);
            expect(projects[3]._data.TeamMembers).to.have.length(1);
        });
    });

    it('should evict the oldest relationship cache entries when the cache limit is exceeded', () => {
        const loader = new RelationshipLoader(createMockClient() as any);

        (loader as any).maxCacheEntries = 2;
        (loader as any)._setCacheEntry('/feature/1', { _ref: '/feature/1' });
        (loader as any)._setCacheEntry('/feature/2', { _ref: '/feature/2' });
        (loader as any)._setCacheEntry('/feature/3', { _ref: '/feature/3' });

        expect((loader as any).cache.has('/feature/1')).to.equal(false);
        expect((loader as any).cache.has('/feature/2')).to.equal(true);
        expect((loader as any).cache.has('/feature/3')).to.equal(true);
        expect((loader as any).cache.size).to.equal(2);
    });
});
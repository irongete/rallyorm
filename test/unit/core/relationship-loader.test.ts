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
    it('should return the original entity unchanged when includes are omitted', async () => {
        const loader = new RelationshipLoader(createMockClient() as any);
        const entity = { _ref: '/defect/1', _type: 'defect' };

        const result = await loader.loadRelationships(entity);

        expect(result).to.equal(entity);
    });

    it('should return the original array unchanged when there are no entities to load', async () => {
        const loader = new RelationshipLoader(createMockClient() as any);
        const entities: any[] = [];

        const result = await loader.loadRelationships(entities, ['Owner']);

        expect(result).to.equal(entities);
    });

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

    it('should chunk large inverse relation queries after deduplicating refs', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Tasks: { type: 'hasMany', entity: 'task', foreignKey: 'WorkProduct', inverseRef: true }
            };
        }

        const queries: string[] = [];
        const client = createMockClient({
            queryAll: async (_entityType: string, options: { query?: string }) => {
                queries.push(String(options.query ?? ''));

                const refs = Array.from(String(options.query ?? '').matchAll(/"(\/hierarchicalrequirement\/\d+)"/g))
                    .map(match => match[1]);

                return refs.map((ref, index) => ({
                    _ref: `/task/${ref.split('/').pop()}${index}`,
                    _type: 'task',
                    Name: `Task for ${ref}`,
                    WorkProduct: { _ref: ref }
                }));
            }
        });

        const loader = new RelationshipLoader(client as any, { inverseQueryChunkSize: 2 });
        const stories = [1, 2, 2, 3, 4].map(id => new Story({
            _ref: `/hierarchicalrequirement/${id}`,
            _type: 'hierarchicalrequirement'
        }));

        await loader.loadRelationships(stories, ['Tasks'], {
            hierarchicalrequirement: Story,
            task: RallyEntity
        });

        expect(queries).to.deep.equal([
            '((WorkProduct = "/hierarchicalrequirement/1") OR (WorkProduct = "/hierarchicalrequirement/2"))',
            '((WorkProduct = "/hierarchicalrequirement/3") OR (WorkProduct = "/hierarchicalrequirement/4"))'
        ]);
        expect(stories[0]._data.Tasks).to.have.length(1);
        expect(stories[1]._data.Tasks).to.have.length(1);
        expect(stories[2]._data.Tasks).to.have.length(1);
        expect(stories[3]._data.Tasks).to.have.length(1);
        expect(stories[4]._data.Tasks).to.have.length(1);
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

    it('should set an empty array when a collection relationship field is missing', async () => {
        class ProjectModel extends RallyEntity {
            static entityType = 'project';
            static relations = {
                TeamMembers: { type: 'hasMany', entity: 'user', foreignKey: 'TeamMemberships', isCollection: true }
            };
        }

        const loader = new RelationshipLoader(createMockClient() as any);
        const project = new ProjectModel({
            _ref: '/project/1',
            _type: 'project'
        });

        await loader.loadRelationships(project, ['TeamMembers'], {
            project: ProjectModel,
            user: RallyEntity
        });

        expect(project._data.TeamMembers).to.deep.equal([]);
    });

    it('should warn and skip inverse relationships missing entity metadata', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Tasks: { type: 'hasMany', foreignKey: 'WorkProduct', inverseRef: true }
            };
        }

        const warnings: string[] = [];
        const loader = new RelationshipLoader(createMockClient({
            logger: {
                debug: () => {},
                info: () => {},
                warn: (message: string) => { warnings.push(message); },
                error: () => {}
            }
        }) as any);
        const story = new Story({
            _ref: '/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement'
        });

        await loader.loadRelationships(story, ['Tasks'], {
            hierarchicalrequirement: Story
        });

        expect(warnings.some(message => message.includes('missing foreignKey or entity'))).to.equal(true);
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

    it('should honor a custom maximum relationship depth', async () => {
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

        const warnings: string[] = [];
        const client = createMockClient({
            logger: {
                debug: () => { },
                info: () => { },
                warn: (message: string) => { warnings.push(message); },
                error: () => { }
            },
            queryAll: async (entityType: string) => {
                if (entityType === 'portfolioitem/feature') {
                    return [{
                        _ref: '/portfolioitem/feature/42',
                        _type: 'portfolioitem/feature',
                        Name: 'Feature 42',
                        Owner: { _ref: '/user/7' }
                    }];
                }

                if (entityType === 'user') {
                    return [{
                        _ref: '/user/7',
                        _type: 'user',
                        DisplayName: 'Ada Lovelace'
                    }];
                }

                return [];
            }
        });

        // maxDepth=1 allows up to 2-segment paths (levels 0 and 1).
        // Feature.Owner (2 segments) is within limit → Feature and Owner are both loaded.
        // Feature.Owner.Reports (3 segments) exceeds maxDepth+1=2 → rejected at parse with a warning.
        const loader = new RelationshipLoader(client as any, { maxDepth: 1 });
        const story = new Story({
            _ref: '/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement',
            Feature: { _ref: '/portfolioitem/feature/42' }
        });

        await loader.loadRelationships(story, ['Feature.Owner', 'Feature.Owner.Reports'], {
            hierarchicalrequirement: Story,
            'portfolioitem/feature': FeatureModel,
            user: UserModel
        });

        // Feature fully loaded
        expect(story._data.Feature).to.include({ _ref: '/portfolioitem/feature/42', Name: 'Feature 42' });
        // Owner fully loaded (within maxDepth=1)
        expect((story._data.Feature as any).Owner).to.include({ DisplayName: 'Ada Lovelace' });
        // 3-segment path rejected at parse time with depth warning
        expect(warnings.some(w => w.includes('exceeds maximum depth') && w.includes('Feature.Owner.Reports'))).to.equal(true);
    });

    it('should apply configured loader cache limits', () => {
        const loader = new RelationshipLoader(createMockClient() as any, {
            maxDepth: 2,
            maxCacheEntries: 3,
            inverseQueryChunkSize: 4
        });

        expect((loader as any).maxDepth).to.equal(2);
        expect((loader as any).maxCacheEntries).to.equal(3);
        expect((loader as any).inverseQueryChunkSize).to.equal(4);
    });

    it('should return entities unchanged when include list is empty', async () => {
        const loader = new RelationshipLoader(createMockClient() as any);
        const entity = new RallyEntity({ _ref: '/defect/1', Name: 'D1' });

        const result = await loader.loadRelationships(entity, []);

        expect(result).to.equal(entity);
    });

    it('should evict oldest cache entry when maxCacheEntries is reached', () => {
        const loader = new RelationshipLoader(createMockClient() as any, { maxCacheEntries: 2 });
        const cache = (loader as any).cache as Map<string, any>;

        (loader as any)._setCacheEntry('/entity/1', { ObjectID: 1 });
        (loader as any)._setCacheEntry('/entity/2', { ObjectID: 2 });
        (loader as any)._setCacheEntry('/entity/3', { ObjectID: 3 });

        expect(cache.size).to.equal(2);
        expect(cache.has('/entity/1')).to.equal(false);
        expect(cache.has('/entity/2')).to.equal(true);
        expect(cache.has('/entity/3')).to.equal(true);
    });

    it('should warn and skip inverse relation when foreignKey is missing from relation definition', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Tasks: { type: 'hasMany', entity: 'task', foreignKey: undefined as any }
            };
        }

        const warnings: string[] = [];
        const client = createMockClient({
            logger: {
                debug: () => { },
                info: () => { },
                warn: (msg: string) => { warnings.push(msg); },
                error: () => { }
            },
            queryAll: async () => []
        });

        const loader = new RelationshipLoader(client as any);
        const story = new Story({ _ref: '/hierarchicalrequirement/1', _type: 'hierarchicalrequirement' });

        await loader.loadRelationships(story, ['Tasks'], {
            hierarchicalrequirement: Story
        });

        expect(warnings.some(w => w.includes('foreignKey'))).to.equal(true);
    });

    it('should set relationship to empty array when collection field has no _ref and no _tagsNameArray', async () => {
        class ProjectModel extends RallyEntity {
            static entityType = 'project';
            static relations = {
                TeamMembers: { type: 'hasMany', entity: 'user', foreignKey: 'TeamMembers', isCollection: true }
            };
        }

        const client = createMockClient({
            queryCollectionAll: async () => []
        });

        const loader = new RelationshipLoader(client as any);
        const project = new ProjectModel({
            _ref: '/project/1',
            _type: 'project',
            TeamMembers: { Count: 0 }
        });

        await loader.loadRelationships(project, ['TeamMembers'], {
            project: ProjectModel
        });

        expect(project._data.TeamMembers).to.deep.equal([]);
    });

    it('should return early from belongsTo loading when no entity has the foreign key set', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
            };
        }

        let queryAllCalled = false;
        const client = createMockClient({
            queryAll: async () => { queryAllCalled = true; return []; }
        });

        const loader = new RelationshipLoader(client as any);
        const story = new Story({
            _ref: '/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement',
            Project: null
        });

        await loader.loadRelationships(story, ['Project'], {
            hierarchicalrequirement: Story,
            project: RallyEntity
        });

        expect(queryAllCalled).to.equal(false);
    });

    it('should skip include paths that exceed the maximum depth and warn', async () => {
        const warnings: string[] = [];
        const client = createMockClient({
            queryAll: async () => []
        });
        (client as any).logger = {
            debug: () => {},
            info: () => {},
            warn: (msg: string) => { warnings.push(msg); },
            error: () => {}
        };

        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {};
        }

        const loader = new RelationshipLoader(client as any);
        const story = new Story({ _ref: '/hierarchicalrequirement/1', _type: 'hierarchicalrequirement' });

        // 7-segment path exceeds maxDepth+1 (default maxDepth=5, so limit=6)
        const deepPath = 'A.B.C.D.E.F.G';
        await loader.loadRelationships(story, [deepPath], { hierarchicalrequirement: Story });

        expect(warnings.some(w => w.includes('exceeds maximum depth') && w.includes(deepPath))).to.equal(true);
    });

    it('should warn and continue when a relationship load rejects', async () => {
        class Story extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                Feature: { type: 'belongsTo', entity: 'portfolioitem/feature', foreignKey: 'Feature' }
            };
        }

        const warnings: string[] = [];
        const client = createMockClient({
            logger: {
                debug: () => {},
                info: () => {},
                warn: (msg: string) => { warnings.push(msg); },
                error: () => {}
            },
            queryAll: async () => { throw new Error('Simulated load failure'); }
        });

        const loader = new RelationshipLoader(client as any);
        const story = new Story({
            _ref: '/hierarchicalrequirement/1',
            _type: 'hierarchicalrequirement',
            Feature: { _ref: '/portfolioitem/feature/42' }
        });

        await loader.loadRelationships(story, ['Feature'], {
            hierarchicalrequirement: Story
        });

        expect(warnings.some(w => w.includes('Failed'))).to.equal(true);
    });
    describe('3.3 Branch Coverage', () => {
        it('should set empty array when _tagsNameArray is present but empty', async () => {
            class ArtifactModel extends RallyEntity {
                static entityType = 'artifact';
                static relations = {
                    Tags: { type: 'hasMany', entity: 'tag', foreignKey: 'Tags', isCollection: true }
                };
            }
            // queryAll should never be called because _tagsNameArray is empty
            const client = createMockClient({ queryAll: async () => [] });
            const loader = new RelationshipLoader(client as any);
            const artifact = new ArtifactModel({
                _ref: '/artifact/1',
                _type: 'artifact',
                Tags: { _tagsNameArray: [] }
            });

            await loader.loadRelationships(artifact, ['Tags'], {
                artifact: ArtifactModel
            });

            // Empty _tagsNameArray → falls through to _ref check → null _ref → empty array set
            expect(artifact._data.Tags).to.deep.equal([]);
        });

        it('should skip entities without a _type in _groupEntitiesByType', async () => {
            class Story extends RallyEntity {
                static entityType = 'hierarchicalrequirement';
                static relations = {
                    Owner: { type: 'belongsTo', entity: 'user' }
                };
            }
            const client = createMockClient({
                getByRef: async () => ({ _ref: '/user/1', Name: 'Alice' })
            });
            const loader = new RelationshipLoader(client as any);
            // Entity without _type should be skipped gracefully
            const story = new Story({
                _ref: '/hierarchicalrequirement/1',
                Owner: { _ref: '/user/1' }
            });
            (story as any)._data._type = undefined;

            // Should not throw even though entity has no type
            await loader.loadRelationships(story, ['Owner'], {
                hierarchicalrequirement: Story
            });
        });

        it('should return undefined from _getCacheEntry on cache miss', () => {
            const loader = new RelationshipLoader(createMockClient() as any);
            const result = (loader as any)._getCacheEntry('/nonexistent/999');
            expect(result).to.equal(undefined);
        });

        it('should promote an accessed cache entry to MRU and evict LRU on overflow', () => {
            const loader = new RelationshipLoader(createMockClient() as any, { maxCacheEntries: 3 });
            (loader as any)._setCacheEntry('/entity/1', { ObjectID: 1 });
            (loader as any)._setCacheEntry('/entity/2', { ObjectID: 2 });
            (loader as any)._setCacheEntry('/entity/3', { ObjectID: 3 });

            // Promote /entity/1 to MRU by accessing it
            (loader as any)._getCacheEntry('/entity/1');

            // Add a 4th entry — should evict /entity/2 (now LRU), not /entity/1
            (loader as any)._setCacheEntry('/entity/4', { ObjectID: 4 });

            const cache: Map<string, unknown> = (loader as any).cache;
            expect(cache.has('/entity/1')).to.equal(true);
            expect(cache.has('/entity/2')).to.equal(false);
            expect(cache.has('/entity/3')).to.equal(true);
            expect(cache.has('/entity/4')).to.equal(true);
        });

        it('should set empty array for a collection field whose _ref is null', async () => {
            class ArtifactModel extends RallyEntity {
                static entityType = 'artifact';
                static relations = {
                    Attachments: { type: 'hasMany', entity: 'attachment', foreignKey: 'Attachments', isCollection: true }
                };
            }
            const client = createMockClient({ queryAll: async () => [] });
            const loader = new RelationshipLoader(client as any);
            const artifact = new ArtifactModel({
                _ref: '/artifact/1',
                _type: 'artifact',
                Attachments: { _ref: null, Count: 0 }
            });

            await loader.loadRelationships(artifact, ['Attachments'], {
                artifact: ArtifactModel
            });

            // Collection field with null _ref → empty array set
            expect(Array.isArray(artifact._data.Attachments)).to.equal(true);
            expect((artifact._data.Attachments as unknown[]).length).to.equal(0);
        });

        it('should leave belongsTo value unchanged when fetched ref does not match entity ref', async () => {
            class Story extends RallyEntity {
                static entityType = 'hierarchicalrequirement';
                static relations = {
                    Owner: { type: 'belongsTo', entity: 'user', foreignKey: 'Owner' }
                };
            }
            // queryAll returns a ref that does NOT match what the entity's foreign key holds
            const client = createMockClient({
                queryAll: async () => [{ _ref: '/user/999', Name: 'Wrong User' }]
            });
            const loader = new RelationshipLoader(client as any);
            const story = new Story({
                _ref: '/hierarchicalrequirement/1',
                _type: 'hierarchicalrequirement',
                Owner: { _ref: '/user/1' }  // Looking for user/1 but loader will get user/999
            });

            await loader.loadRelationships(story, ['Owner'], {
                hierarchicalrequirement: Story
            });

            // When returned ref (/user/999) doesn't match the foreign key (/user/1),
            // the entity map lookup fails and the field is left as-is (original ref object)
            const owner = story._data.Owner as { _ref: string };
            expect(owner).to.not.be.undefined;
            expect(owner._ref).to.equal('/user/1');
        });
    });

    describe('3.4 New Behaviour Coverage', () => {
        it('should chunk _batchLoadByRefs queries when objectIds exceed inverseQueryChunkSize', async () => {
            const queryAllCalls: string[][] = [];

            class DefectModel extends RallyEntity {
                static entityType = 'defect';
                static relations = {
                    Owner: { type: 'belongsTo', entity: 'user', foreignKey: 'Owner' }
                };
            }

            const client = createMockClient({
                queryAll: async (_type: string, opts: any) => {
                    queryAllCalls.push(opts.query);
                    return [];
                }
            });

            // 5 distinct FK refs, chunk size 2 → expect 3 queryAll calls (2+2+1)
            const loader = new RelationshipLoader(client as any, { inverseQueryChunkSize: 2 });
            const entities = [1, 2, 3, 4, 5].map(n =>
                new DefectModel(
                    { _ref: `/defect/${n}`, _type: 'defect', Owner: { _ref: `/user/${n}` } },
                    undefined
                )
            );

            await loader.loadRelationships(entities, ['Owner'], { defect: DefectModel });

            expect(queryAllCalls.length).to.equal(3);
        });

        it('should process collection entities in chunks of collectionConcurrency', async () => {
            const collectionCallRefs: string[] = [];

            class ProjectModel extends RallyEntity {
                static entityType = 'project';
                static relations = {
                    Children: { type: 'hasMany', entity: 'project', foreignKey: 'Children', isCollection: true }
                };
            }

            const client = createMockClient({
                queryCollectionAll: async (ref: string) => {
                    collectionCallRefs.push(ref);
                    return [];
                }
            });

            const loader = new RelationshipLoader(client as any, { collectionConcurrency: 2 });
            const entities = [1, 2, 3, 4, 5].map(n =>
                new ProjectModel(
                    { _ref: `/project/${n}`, _type: 'project', Children: { _ref: `/project/${n}/children` } },
                    undefined
                )
            );

            await loader.loadRelationships(entities, ['Children'], { project: ProjectModel });

            // All 5 collection refs should have been queried
            expect(collectionCallRefs).to.have.length(5);
        });

        it('should warn when include path references a relation not registered on any entity type', async () => {
            const warnings: string[] = [];

            class StoryModel extends RallyEntity {
                static entityType = 'hierarchicalrequirement';
                static relations = {
                    Feature: { type: 'belongsTo', entity: 'portfolioitem/feature', foreignKey: 'Feature' }
                };
            }

            const client = createMockClient({
                queryAll: async () => []
            });
            (client as any).logger = {
                debug: () => {},
                info: () => {},
                warn: (msg: string) => { warnings.push(msg); },
                error: () => {}
            };

            const loader = new RelationshipLoader(client as any);
            const story = new StoryModel(
                { _ref: '/hierarchicalrequirement/1', _type: 'hierarchicalrequirement', Feature: { _ref: '/portfolioitem/feature/1' } },
                undefined
            );

            await loader.loadRelationships(story, ['TypoRelation.Name'], { hierarchicalrequirement: StoryModel });

            // TypoRelation.Name warns because 'TypoRelation' is a non-leaf node processed
            // as a relation. A standalone 'TypoRelation' would be treated silently as a
            // scalar field hint (indistinguishable from 'Name' etc.) under the smart filter.
            expect(warnings.some(w => w.includes('TypoRelation'))).to.equal(true);
        });
    });

    describe('Type-filtered include paths (select syntax)', () => {
        class StoryModel extends RallyEntity {
            static entityType = 'hierarchicalrequirement';
            static relations = {
                TestCases: { type: 'hasMany', entity: 'testcase', foreignKey: 'TestCases', isCollection: true }
            };
        }

        class DefectModel extends RallyEntity {
            static entityType = 'defect';
            static relations = {
                TestCases: { type: 'hasMany', entity: 'testcase', foreignKey: 'TestCases', isCollection: true }
            };
        }

        class TestSetModel extends RallyEntity {
            static entityType = 'testset';
            static relations = {
                WorkProducts: { type: 'hasMany', entity: 'artifact', foreignKey: 'WorkProducts', isCollection: true }
            };
        }

        const registry = { hierarchicalrequirement: StoryModel, defect: DefectModel, testset: TestSetModel };

        function createPolymorphicClient(collectionCalls: string[]) {
            return createMockClient({
                queryCollectionAll: async (ref: string) => {
                    collectionCalls.push(ref);
                    if (ref === '/testset/1/WorkProducts') {
                        return [
                            { _ref: '/hierarchicalrequirement/10', _type: 'HierarchicalRequirement', Name: 'Story', TestCases: { _ref: '/hierarchicalrequirement/10/TestCases', Count: 1 } },
                            { _ref: '/defect/20', _type: 'Defect', Name: 'Defect', TestCases: { _ref: '/defect/20/TestCases', Count: 1 } }
                        ];
                    }
                    if (ref === '/hierarchicalrequirement/10/TestCases') {
                        return [{ _ref: '/testcase/100', _type: 'TestCase', Name: 'TC-100' }];
                    }
                    if (ref === '/defect/20/TestCases') {
                        return [{ _ref: '/testcase/200', _type: 'TestCase', Name: 'TC-200' }];
                    }
                    return [];
                }
            });
        }

        function createTestSet() {
            return new TestSetModel({
                _ref: '/testset/1',
                _type: 'TestSet',
                WorkProducts: { _ref: '/testset/1/WorkProducts', Count: 2 }
            });
        }

        it('should parse a bracketed segment into relationName + lower-cased typeFilter', () => {
            const loader = new RelationshipLoader(createMockClient() as any) as any;

            const paths = loader._parseIncludePaths(['WorkProducts[HierarchicalRequirement].TestCases']);
            const node = paths['WorkProducts[hierarchicalrequirement]'];

            expect(node).to.not.equal(undefined);
            expect(node.relationName).to.equal('WorkProducts');
            expect(node.typeFilter).to.equal('hierarchicalrequirement');
            expect(node.isLeaf).to.equal(false);
            expect(node.children.TestCases).to.include({ relationName: 'TestCases', isLeaf: true });
            expect(node.children.TestCases.typeFilter).to.equal(undefined);
        });

        it('should keep filtered and unfiltered segments for the same relation as separate tree nodes', () => {
            const loader = new RelationshipLoader(createMockClient() as any) as any;

            const paths = loader._parseIncludePaths(['WorkProducts.Name', 'WorkProducts[Defect].TestCases']);

            expect(Object.keys(paths)).to.have.members(['WorkProducts', 'WorkProducts[defect]']);
        });

        it('should mark a node as non-leaf when a longer path passes through it', () => {
            const loader = new RelationshipLoader(createMockClient() as any) as any;

            const paths = loader._parseIncludePaths(['Owner', 'Owner.Workspace']);

            expect(paths.Owner.isLeaf).to.equal(false);
            expect(paths.Owner.children.Workspace.isLeaf).to.equal(true);
        });

        it('should load the full polymorphic collection but only recurse into the filtered type', async () => {
            const collectionCalls: string[] = [];
            const loader = new RelationshipLoader(createPolymorphicClient(collectionCalls) as any);
            const testSet = createTestSet();

            await loader.loadRelationships(testSet, ['WorkProducts[HierarchicalRequirement].TestCases'], registry);

            const [story, defect] = testSet._data.WorkProducts;
            expect(testSet._data.WorkProducts).to.have.length(2);
            expect(story.TestCases).to.deep.equal([{ _ref: '/testcase/100', _type: 'TestCase', Name: 'TC-100' }]);
            expect(defect.TestCases).to.deep.equal({ _ref: '/defect/20/TestCases', Count: 1 });
            expect(collectionCalls).to.not.include('/defect/20/TestCases');
        });

        it('should recurse into every work product type when no filter is given', async () => {
            const collectionCalls: string[] = [];
            const loader = new RelationshipLoader(createPolymorphicClient(collectionCalls) as any);
            const testSet = createTestSet();

            await loader.loadRelationships(testSet, ['WorkProducts.TestCases'], registry);

            const [story, defect] = testSet._data.WorkProducts;
            expect(story.TestCases).to.have.length(1);
            expect(defect.TestCases).to.have.length(1);
            expect(collectionCalls).to.include.members(['/hierarchicalrequirement/10/TestCases', '/defect/20/TestCases']);
        });

        it('should not recurse at all when the filter matches none of the loaded entities', async () => {
            const collectionCalls: string[] = [];
            const loader = new RelationshipLoader(createPolymorphicClient(collectionCalls) as any);
            const testSet = createTestSet();

            await loader.loadRelationships(testSet, ['WorkProducts[Task].TestCases'], registry);

            expect(testSet._data.WorkProducts).to.have.length(2);
            expect(collectionCalls).to.deep.equal(['/testset/1/WorkProducts']);
        });

        it('should treat a relation named like an entity type as a relation, never as a type filter', () => {
            // Regression guard: 'Iteration.Project.Name' must stay a plain relation chain even
            // though 'project' is a registered entity type — only bracket syntax is a filter.
            const loader = new RelationshipLoader(createMockClient() as any) as any;

            const paths = loader._parseIncludePaths(['Iteration.Project.Name']);

            expect(paths.Iteration.typeFilter).to.equal(undefined);
            expect(paths.Iteration.children.Project.relationName).to.equal('Project');
            expect(paths.Iteration.children.Project.typeFilter).to.equal(undefined);
            expect(paths.Iteration.children.Project.children.Name.isLeaf).to.equal(true);
        });

        it('should silently ignore scalar leaves and still eager-load single-segment relation names', async () => {
            const warnings: string[] = [];
            const collectionCalls: string[] = [];
            const client = createPolymorphicClient(collectionCalls);
            client.logger = { debug() {}, info() {}, warn: (m: string) => warnings.push(m), error() {} };
            const loader = new RelationshipLoader(client as any);
            const testSet = createTestSet();

            await loader.loadRelationships(testSet, ['Name', 'ObjectID', 'WorkProducts'], registry);

            expect(warnings).to.deep.equal([]);
            expect(collectionCalls).to.deep.equal(['/testset/1/WorkProducts']);
            expect(testSet._data.WorkProducts).to.have.length(2);
        });

        it('should emit per-source-type progress sub-events only for polymorphic loads', async () => {
            const events: any[] = [];
            const client = createPolymorphicClient([]);
            client.emitProgress = (event: any) => events.push(event);
            const loader = new RelationshipLoader(client as any);
            const testSet = createTestSet();

            await loader.loadRelationships(testSet, ['WorkProducts.TestCases'], registry);

            const workProductEvents = events.filter(e => e.relationshipName === 'WorkProducts');
            const testCaseEvents = events.filter(e => e.relationshipName === 'TestCases');

            // Level 1: a single source type (testset) → no sub-events.
            expect(workProductEvents.length).to.be.greaterThan(0);
            expect(workProductEvents.every(e => e.sourceEntityType === undefined)).to.equal(true);

            // Level 2: two source types → one shared bar plus one sub-event per source model.
            const subEvents = testCaseEvents.filter(e => e.sourceEntityType !== undefined);
            expect(subEvents.map(e => e.sourceEntityType)).to.have.members(['StoryModel', 'DefectModel']);
            expect(subEvents.every(e => e.total === 1 && e.current === 1)).to.equal(true);

            const sharedEvents = testCaseEvents.filter(e => e.sourceEntityType === undefined);
            expect(sharedEvents.map(e => e.total)).to.deep.equal([2, 2]);
            expect(sharedEvents.map(e => e.current).sort()).to.deep.equal([1, 2]);
        });
    });
});
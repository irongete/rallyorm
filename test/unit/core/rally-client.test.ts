import { expect } from 'chai';
import { readFileSync } from 'node:fs';
import { RallyClient } from '../../../src/core/rally-client.js';
import { createMockFetch } from '../../setup/test-helpers.js';

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

async function expectAsyncError(fn: () => Promise<unknown>, pattern: RegExp): Promise<void> {
    try {
        await fn();
        expect.fail('Expected async function to throw');
    } catch (error: any) {
        expect(String(error?.message ?? error)).to.match(pattern);
    }
}

function loadPackageVersion(): string {
    const candidatePaths = [
        new URL('../../../package.json', import.meta.url),
        new URL('../../../../package.json', import.meta.url)
    ];

    for (const candidatePath of candidatePaths) {
        try {
            const packageJson = JSON.parse(readFileSync(candidatePath, 'utf8')) as { version?: string };
            if (typeof packageJson.version === 'string') {
                return packageJson.version;
            }
        } catch {}
    }

    throw new Error('Could not load package.json version for RallyClient tests');
}

const packageVersion = loadPackageVersion();

describe('RallyClient', function () {
    this.timeout(5000);

    describe('Constructor', () => {
        it('should require apiKey', () => {
            expect(() => new RallyClient({} as any)).to.throw('apiKey is required');
        });

        it('should accept valid configuration', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            expect(client).to.be.instanceOf(RallyClient);
        });

        it('should set default values', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            expect(client.baseUrl).to.include('rally1.rallydev.com');
            expect(client.timeoutMs).to.be.at.least(1000);
            expect(client.retries).to.be.at.least(0);
        });

        it('should reject invalid authMode', () => {
            expect(() => new RallyClient({
                apiKey: 'test-key',
                authMode: 'invalid' as any
            })).to.throw('authMode');
        });

        it('should set a User-Agent header with the package version', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            expect((client as any).defaultHeaders['User-Agent']).to.equal(`RallyORM/${packageVersion}`);
        });

        it('should honor RALLY_MAX_CONCURRENT_REQUESTS when queueOptions.concurrency is not set', async () => {
            await withEnv({
                RALLY_MAX_CONCURRENT_REQUESTS: '3'
            }, () => {
                const client = new RallyClient({
                    apiKey: 'test-key',
                    fetch: createMockFetch({})
                });

                expect((client as any).queue.concurrency).to.equal(3);
            });
        });

        it('should let queueOptions.concurrency override RALLY_MAX_CONCURRENT_REQUESTS', async () => {
            await withEnv({
                RALLY_MAX_CONCURRENT_REQUESTS: '3'
            }, () => {
                const client = new RallyClient({
                    apiKey: 'test-key',
                    fetch: createMockFetch({}),
                    queueOptions: { concurrency: 7 }
                });

                expect((client as any).queue.concurrency).to.equal(7);
            });
        });

        it('should reject invalid RALLY_MAX_CONCURRENT_REQUESTS values', async () => {
            await withEnv({
                RALLY_MAX_CONCURRENT_REQUESTS: '0'
            }, () => {
                expect(() => new RallyClient({
                    apiKey: 'test-key',
                    fetch: createMockFetch({})
                })).to.throw('RALLY_MAX_CONCURRENT_REQUESTS');
            });
        });
    });

    describe('Write Permissions', () => {
        it('should default to read-only for write operations', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            const perms = client.getWritePermissions();
            expect(perms.allowCreate).to.equal(false);
            expect(perms.allowUpdate).to.equal(false);
            expect(perms.allowDelete).to.equal(false);
        });

        it('should allow enabling write operations', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({}),
                allowCreate: true,
                allowUpdate: true,
                allowDelete: true
            });
            const perms = client.getWritePermissions();
            expect(perms.allowCreate).to.equal(true);
            expect(perms.allowUpdate).to.equal(true);
            expect(perms.allowDelete).to.equal(true);
        });

        it('should block all writes when readOnly is true', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({}),
                readOnly: true,
                allowCreate: true,
                allowUpdate: true
            });
            const perms = client.getWritePermissions();
            expect(perms.readOnly).to.equal(true);
            expect(perms.allowCreate).to.equal(false);
            expect(perms.allowUpdate).to.equal(false);
        });

        it('should honor global write enablement from environment variables', async () => {
            await withEnv({
                RALLY_ALLOW_WRITE: 'true',
                RALLY_READ_ONLY: undefined,
                RALLY_ALLOW_CREATE: undefined,
                RALLY_ALLOW_UPDATE: undefined,
                RALLY_ALLOW_DELETE: undefined
            }, () => {
                const client = new RallyClient({
                    apiKey: 'test-key',
                    fetch: createMockFetch({})
                });

                expect(client.getWritePermissions()).to.deep.equal({
                    readOnly: false,
                    allowCreate: true,
                    allowUpdate: true,
                    allowDelete: true
                });
            });
        });

        it('should let environment read-only override explicit write flags', async () => {
            await withEnv({
                RALLY_READ_ONLY: '1',
                RALLY_ALLOW_WRITE: undefined,
                RALLY_ALLOW_CREATE: undefined,
                RALLY_ALLOW_UPDATE: undefined,
                RALLY_ALLOW_DELETE: undefined
            }, () => {
                const client = new RallyClient({
                    apiKey: 'test-key',
                    fetch: createMockFetch({}),
                    allowCreate: true,
                    allowUpdate: true,
                    allowDelete: true
                });

                expect(client.getWritePermissions()).to.deep.equal({
                    readOnly: true,
                    allowCreate: false,
                    allowUpdate: false,
                    allowDelete: false
                });
            });
        });
    });

    describe('URL Building', () => {
        it('should build correct entity URLs', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            expect((client as any)._url('defect')).to.include('/defect');
            expect((client as any)._url('hierarchicalrequirement')).to.include('/hierarchicalrequirement');
        });

        it('should include workspace in params when configured', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                workspace: 'W12345',
                fetch: createMockFetch({})
            });
            const params = (client as any)._params({ foo: 'bar' });
            expect(params.workspace).to.equal('W12345');
            expect(params.foo).to.equal('bar');
        });

        it('should use the zsessionid header when that auth mode is configured', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                authMode: 'zsessionid',
                fetch: createMockFetch({})
            });

            expect((client as any).defaultHeaders).to.not.have.property('Authorization');
            expect((client as any).defaultHeaders.zsessionid).to.equal('test-key');
        });

        it('should attach the sticky session cookie captured from a previous response', async () => {
            let requestCount = 0;

            const client = new RallyClient({
                apiKey: 'test-key',
                logLevel: 'silent',
                fetch: async (_url, init) => {
                    requestCount += 1;

                    if (requestCount === 2) {
                        expect((init?.headers as Record<string, string>)?.Cookie).to.equal('JSESSIONID=sticky123');
                    }

                    return {
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            get: () => null,
                            getSetCookie: () => requestCount === 1 ? ['JSESSIONID=sticky123; Path=/; HttpOnly'] : []
                        },
                        text: async () => JSON.stringify({ QueryResult: { Results: [] } })
                    } as unknown as Response;
                }
            });

            await client.query('defect');
            await client.query('defect');
        });
    });

    describe('Operations', () => {
        it('should reject writes when create permission is missing', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            await expectAsyncError(
                () => client.create('defect', { Name: 'Blocked' }),
                /CREATE operation for defect not allowed/
            );
        });

        it('should reject writes when update permission is missing', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            await expectAsyncError(
                () => client.update('defect', 123, { Name: 'Blocked' }),
                /UPDATE operation for defect not allowed/
            );
        });

        it('should reject writes when delete permission is missing', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            await expectAsyncError(
                () => client.delete('defect', 123),
                /DELETE operation for defect not allowed/
            );
        });

        it('should throw when create returns operation errors', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                allowCreate: true,
                fetch: createMockFetch({
                    '/defect/create': {
                        CreateResult: {
                            Errors: ['Validation failed'],
                            Warnings: []
                        }
                    }
                })
            });

            await expectAsyncError(
                () => client.create('defect', { Name: 'Broken' }),
                /Rally create failed for defect: Validation failed/
            );
        });

        it('should throw when delete returns operation errors', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                allowDelete: true,
                fetch: createMockFetch({
                    '/defect/123': {
                        OperationResult: {
                            Errors: ['Delete denied'],
                            Warnings: []
                        }
                    }
                })
            });

            await expectAsyncError(
                () => client.delete('defect', 123),
                /Rally delete failed for defect 123: Delete denied/
            );
        });

        it('should throw when update response explicitly reports failure even without errors', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                allowUpdate: true,
                fetch: createMockFetch({
                    '/defect/create': {
                        OperationResult: {
                            Success: false,
                            Errors: [],
                            Warnings: []
                        }
                    }
                })
            });

            await expectAsyncError(
                () => client.update('defect', 123, { Name: 'Broken' }),
                /response did not confirm success/
            );
        });

        it('should throw when create response is ambiguous and does not include an entity payload', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                allowCreate: true,
                fetch: createMockFetch({
                    '/defect/create.js': {
                        CreateResult: {
                            Warnings: []
                        }
                    }
                })
            });

            await expectAsyncError(
                () => client.create('defect', { Name: 'Broken' }),
                /response did not confirm success/
            );
        });

        it('should treat root entity payload responses as successful writes', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                allowUpdate: true,
                fetch: createMockFetch({
                    '/defect/123': {
                        defect: {
                            ObjectID: 123,
                            Name: 'Updated'
                        }
                    }
                })
            });

            const updated = await client.update('defect', 123, { Name: 'Updated' });
            expect(updated).to.deep.equal({ ObjectID: 123, Name: 'Updated' });
        });

        it('should treat delete envelopes without explicit errors as successful deletes', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                allowDelete: true,
                fetch: createMockFetch({
                    '/defect/123': {
                        DeleteResult: {
                            Warnings: []
                        }
                    }
                })
            });

            const deleted = await client.delete('defect', 123);
            expect(deleted).to.equal(true);
        });

        it('should throw when delete response is ambiguous and does not confirm success', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                allowDelete: true,
                fetch: createMockFetch({
                    '/defect/123': {
                        Warnings: []
                    }
                })
            });

            await expectAsyncError(
                () => client.delete('defect', 123),
                /response did not confirm success/
            );
        });
    });

    describe('Paging Validation', () => {
        it('should reject invalid start values for query', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            await expectAsyncError(
                () => client.query('defect', { start: 0 }),
                /start must be an integer >= 1/
            );
        });

        it('should reject non-positive pagesize values for queryAll', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            await expectAsyncError(
                () => client.queryAll('defect', { pagesize: 0 }),
                /pagesize must be an integer >= 1/
            );
        });

        it('should reject invalid pagesize values for queryCollection', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            await expectAsyncError(
                () => client.queryCollection('/defect/123/tasks', { pagesize: -1 }),
                /pagesize must be an integer >= 1/
            );
        });

        it('should short-circuit queryAll when maxResults is zero', async () => {
            let fetchCalls = 0;
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: async () => {
                    fetchCalls += 1;
                    throw new Error('fetch should not be called');
                }
            });

            const results = await client.queryAll('defect', { maxResults: 0 });

            expect(results).to.deep.equal([]);
            expect(fetchCalls).to.equal(0);
        });

        it('should paginate queryCollectionAll until all results are fetched', async () => {
            const seenStarts: number[] = [];

            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: async (url) => {
                    const parsedUrl = new URL(String(url));
                    const start = Number(parsedUrl.searchParams.get('start') || '1');
                    seenStarts.push(start);

                    const pages: Record<number, any[]> = {
                        1: [{ ObjectID: 1 }, { ObjectID: 2 }],
                        3: [{ ObjectID: 3 }, { ObjectID: 4 }],
                        5: [{ ObjectID: 5 }]
                    };

                    return {
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: { get: () => null, getSetCookie: () => [] },
                        text: async () => JSON.stringify({
                            QueryResult: {
                                Results: pages[start] || [],
                                TotalResultCount: 5
                            }
                        })
                    } as unknown as Response;
                }
            });

            const results = await client.queryCollectionAll('/project/1/TeamMembers', {
                pagesize: 2
            });

            expect(results.map(result => result.ObjectID)).to.deep.equal([1, 2, 3, 4, 5]);
            expect(seenStarts).to.deep.equal([1, 3, 5]);
        });
    });

    describe('Response Parsing', () => {
        it('should extract entity from CreateResult', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            const response = { CreateResult: { Object: { ObjectID: 123 } } };
            const entity = (client as any)._extractEntityFromResponse(response, 'defect');
            expect(entity.ObjectID).to.equal(123);
        });

        it('should extract entity from OperationResult', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            const response = { OperationResult: { Object: { ObjectID: 456 } } };
            const entity = (client as any)._extractEntityFromResponse(response, 'defect');
            expect(entity.ObjectID).to.equal(456);
        });

        it('should extract entity from WSAPI get responses using case-insensitive entity keys', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            const response = { HierarchicalRequirement: { ObjectID: 789, Name: 'Story' } };
            const entity = (client as any)._extractEntityFromResponse(response, 'hierarchicalrequirement');
            expect(entity.ObjectID).to.equal(789);
            expect(entity.Name).to.equal('Story');
        });

        it('should detect concurrency conflicts', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });
            expect((client as any)._isConcurrencyConflict(['Concurrency conflict'])).to.equal(true);
            expect((client as any)._isConcurrencyConflict(['Modified since read'])).to.equal(true);
            expect((client as any)._isConcurrencyConflict(['Some other error'])).to.equal(false);
        });

        it('should query collection refs through their WSAPI endpoint', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({
                    '/project/1/TeamMembers': {
                        QueryResult: {
                            Results: [{ ObjectID: 7, DisplayName: 'Ada Lovelace' }],
                            TotalResultCount: 1
                        }
                    }
                })
            });

            const results = await client.queryCollection('/project/1/TeamMembers', {
                fetch: 'ObjectID,DisplayName'
            });

            expect(results).to.have.length(1);
            expect(results[0]).to.include({ ObjectID: 7, DisplayName: 'Ada Lovelace' });
        });

        it('should reject invalid collection refs', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            await expectAsyncError(
                () => client.queryCollection('' as any),
                /Collection reference is required and must be a string/
            );
        });

        it('should surface malformed JSON responses as retryable errors', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                retries: 0,
                fetch: async () => ({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null, getSetCookie: () => [] },
                    text: async () => '{invalid json'
                } as unknown as Response)
            });

            await expectAsyncError(
                () => client.query('defect'),
                /Invalid JSON response/
            );
        });
    });

    describe('Pagination', () => {
        it('should fetch all pages when queryAll TotalResultCount exceeds first page', async () => {
            const fetchedStarts: number[] = [];

            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: async (url) => {
                    const start = Number(new URL(String(url)).searchParams.get('start') || '1');
                    fetchedStarts.push(start);
                    const items = start === 1
                        ? [{ ObjectID: 1 }, { ObjectID: 2 }]
                        : [{ ObjectID: 3 }, { ObjectID: 4 }];

                    return {
                        ok: true, status: 200, statusText: 'OK',
                        headers: { get: () => null, getSetCookie: () => [] },
                        text: async () => JSON.stringify({
                            QueryResult: { Results: items, TotalResultCount: 4 }
                        })
                    } as unknown as Response;
                }
            });

            const results = await client.queryAll('defect', { pagesize: 2 });

            expect(results).to.have.length(4);
            expect(fetchedStarts).to.include(1);
            expect(fetchedStarts).to.include(3);
        });

        it('should cap queryAll results at maxResults even when more exist', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: async () => ({
                    ok: true, status: 200, statusText: 'OK',
                    headers: { get: () => null, getSetCookie: () => [] },
                    text: async () => JSON.stringify({
                        QueryResult: {
                            Results: [{ ObjectID: 1 }, { ObjectID: 2 }, { ObjectID: 3 }],
                            TotalResultCount: 100
                        }
                    })
                } as unknown as Response)
            });

            const results = await client.queryAll('defect', { maxResults: 2 });

            expect(results).to.have.length(2);
        });

        it('should return empty array from queryAll when first page has no QueryResult', async () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: async () => ({
                    ok: true, status: 200, statusText: 'OK',
                    headers: { get: () => null, getSetCookie: () => [] },
                    text: async () => JSON.stringify({})
                } as unknown as Response)
            });

            const results = await client.queryAll('defect');

            expect(results).to.deep.equal([]);
        });
    });

    describe('Resilience', () => {
        it('should retry and succeed after a 5xx server error', async () => {
            let callCount = 0;

            const client = new RallyClient({
                apiKey: 'test-key',
                retries: 1,
                retryDelayMs: 10,
                fetch: async () => {
                    callCount += 1;
                    if (callCount === 1) {
                        return {
                            ok: false, status: 503, statusText: 'Service Unavailable',
                            headers: { get: () => null, getSetCookie: () => [] },
                            text: async () => ''
                        } as unknown as Response;
                    }

                    return {
                        ok: true, status: 200, statusText: 'OK',
                        headers: { get: () => null, getSetCookie: () => [] },
                        text: async () => JSON.stringify({
                            QueryResult: { Results: [{ ObjectID: 1 }], TotalResultCount: 1 }
                        })
                    } as unknown as Response;
                }
            });

            const results = await client.query('defect');

            expect(results).to.have.length(1);
            expect(callCount).to.equal(2);
        });

        it('should retry create on concurrency conflict and succeed on second attempt', async () => {
            let callCount = 0;

            const client = new RallyClient({
                apiKey: 'test-key',
                allowCreate: true,
                retries: 1,
                retryDelayMs: 10,
                fetch: async () => {
                    callCount += 1;
                    if (callCount === 1) {
                        return {
                            ok: true, status: 200, statusText: 'OK',
                            headers: { get: () => null, getSetCookie: () => [] },
                            text: async () => JSON.stringify({
                                CreateResult: {
                                    Errors: ['Concurrency conflict: object has been modified since being read'],
                                    Warnings: []
                                }
                            })
                        } as unknown as Response;
                    }

                    return {
                        ok: true, status: 200, statusText: 'OK',
                        headers: { get: () => null, getSetCookie: () => [] },
                        text: async () => JSON.stringify({
                            CreateResult: {
                                Object: { ObjectID: 999, Name: 'Created' },
                                Errors: [],
                                Warnings: []
                            }
                        })
                    } as unknown as Response;
                }
            });

            const result = await client.create('defect', { Name: 'Test' });

            expect(result.ObjectID).to.equal(999);
            expect(callCount).to.equal(2);
        });

        it('should expose getRelationshipLoaderOptions values from config', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({}),
                relationshipLoaderOptions: { maxDepth: 3, maxCacheEntries: 100 }
            });

            const opts = client.getRelationshipLoaderOptions();

            expect(opts.maxDepth).to.equal(3);
            expect(opts.maxCacheEntries).to.equal(100);
        });

        it('should return empty object from getRelationshipLoaderOptions when no options configured', () => {
            const client = new RallyClient({
                apiKey: 'test-key',
                fetch: createMockFetch({})
            });

            const opts = client.getRelationshipLoaderOptions();

            expect(opts).to.deep.equal({});
        });
    });
});

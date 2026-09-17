import { expect } from 'chai';
import { RallyRepository } from '../../../src/core/rally-repository.js';
import { LazyLink } from '../../../src/core/lazy-link.js';
import { RallyValidationError } from '../../../src/core/errors.js';
import { RallyEntity } from '../../../src/models/base-entity.js';
import { createMockClient } from '../../setup/test-helpers.js';
import { mockDefect } from '../../setup/fixtures.js';

describe('RallyRepository', function () {
    this.timeout(5000);

    describe('Constructor', () => {
        it('should require entityType', () => {
            expect(() => new RallyRepository(undefined as any, createMockClient())).to.throw('Entity type is required');
        });

        it('should require valid client', () => {
            expect(() => new RallyRepository('defect', undefined as any)).to.throw('Rally client is required');
        });

        it('should accept valid configuration', () => {
            const client = createMockClient();
            const repo = new RallyRepository('defect', client);
            expect(repo.entityType).to.equal('defect');
        });
    });

    describe('Query Builder', () => {
        let repo: any;

        beforeEach(() => {
            repo = new RallyRepository('defect', createMockClient());
        });

        it('should build simple equality condition', () => {
            const query = repo._buildQuery({ Name: 'Test' });
            expect(query).to.include('(Name = "Test")');
        });

        it('should build $contains condition', () => {
            const query = repo._buildQuery({ Name: { $contains: 'Test' } });
            expect(query).to.include('contains "Test"');
        });

        it('should build $in condition as OR', () => {
            const query = repo._buildQuery({ State: { $in: ['Open', 'Closed'] } });
            expect(query).to.include(' OR ');
            expect(query).to.include('State');
        });

        it('should build comparison operators', () => {
            const query = repo._buildQuery({
                Estimate: { $gt: 0, $lte: 10 }
            });
            expect(query).to.include('> "0"');
            expect(query).to.include('<= "10"');
        });

        it('should build nested field conditions', () => {
            const query = repo._buildQuery({ Project: { Name: 'MyProject' } });
            expect(query).to.include('Project.Name');
        });

        it('should build $and conditions', () => {
            const query = repo._buildQuery({
                $and: [{ State: 'Open' }, { Priority: 'High' }]
            });
            expect(query).to.include(' AND ');
        });

        it('should build $or conditions', () => {
            const query = repo._buildQuery({
                $or: [{ State: 'Open' }, { State: 'Closed' }]
            });
            expect(query).to.include(' OR ');
        });

        it('should AND $or condition with sibling fields', () => {
            const query = repo._buildQuery({
                $or: [{ State: 'Open' }, { State: 'Closed' }],
                Priority: 'High'
            });
            expect(query).to.include(' OR ');
            expect(query).to.include(' AND ');
            expect(query).to.include('State');
            expect(query).to.include('Priority');
        });

        it('should AND $and condition with sibling fields', () => {
            const query = repo._buildQuery({
                $and: [{ State: 'Open' }, { Severity: 'Critical' }],
                Priority: 'High'
            });
            expect(query).to.include(' AND ');
            expect(query).to.include('State');
            expect(query).to.include('Severity');
            expect(query).to.include('Priority');
        });

        it('should emit null equality condition for null field value', () => {
            const query = repo._buildQuery({ Owner: null });
            expect(query).to.equal('(Owner = null)');
        });

        it('should translate $ne null into a Rally "is not null" condition', () => {
            const query = repo._buildQuery({ WorkProduct: { $ne: null } });
            expect(query).to.equal('(WorkProduct != null)');
        });

        it('should translate $eq null into a Rally "is null" condition', () => {
            const query = repo._buildQuery({ Owner: { $eq: null } });
            expect(query).to.equal('(Owner = null)');
        });

        it('should keep a null (in)equality operator alongside sibling conditions', () => {
            const query = repo._buildQuery({ Owner: { $ne: null }, State: 'Open' });
            expect(query).to.equal('((Owner != null) AND (State = "Open"))');
        });

        it('should reject null operands for operators other than $eq and $ne', () => {
            expect(() => repo._buildQuery({ PlanEstimate: { $gt: null } })).to.throw(RallyValidationError, /does not accept null/);
            expect(() => repo._buildQuery({ Name: { $contains: null } })).to.throw(RallyValidationError);
        });

        it('should still skip undefined operator operands silently', () => {
            const query = repo._buildQuery({ PlanEstimate: { $gt: undefined }, State: 'Open' });
            expect(query).to.equal('(State = "Open")');
        });

        it('should make an empty $in match nothing instead of dropping the condition', () => {
            expect(repo._buildQuery({ ObjectID: { $in: [] } })).to.equal('(ObjectID = 0)');
            expect(repo._buildQuery({ State: [] })).to.equal('(ObjectID = 0)');
            expect(repo._buildQuery({ State: { $in: [undefined] } })).to.equal('(ObjectID = 0)');
            expect(repo._buildQuery({ ObjectID: { $in: [] }, State: 'Open' })).to.equal('((ObjectID = 0) AND (State = "Open"))');
        });

        it('should translate null items inside $in into "is null" alternatives', () => {
            expect(repo._buildQuery({ Owner: { $in: [null] } })).to.equal('(Owner = null)');
            expect(repo._buildQuery({ Owner: { $in: [null, 'x'] } })).to.equal('((Owner = null) OR (Owner = "x"))');
            expect(repo._buildQuery({ Owner: [null, 'x'] })).to.equal('((Owner = null) OR (Owner = "x"))');
        });

        it('should reject a non-array $in operand', () => {
            expect(() => repo._buildQuery({ State: { $in: 'Open' } })).to.throw(RallyValidationError, /requires an array/);
        });

        it('should make an empty $or match nothing', () => {
            expect(repo._buildQuery({ $or: [] })).to.equal('(ObjectID = 0)');
            expect(repo._buildQuery({ $or: [], State: 'Open' })).to.equal('((ObjectID = 0) AND (State = "Open"))');
            // Alternatives that carry no constraint are still ignored (unchanged behaviour).
            expect(repo._buildQuery({ $or: [{ State: 'Open' }, {}] })).to.equal('((State = "Open"))');
        });

        it('should serialize Date values as ISO 8601 in every operator position', () => {
            const date = new Date('2026-01-02T03:04:05.678Z');
            expect(repo._buildQuery({ CreationDate: { $gt: date } })).to.equal('(CreationDate > "2026-01-02T03:04:05.678Z")');
            expect(repo._buildQuery({ CreationDate: date })).to.equal('(CreationDate = "2026-01-02T03:04:05.678Z")');
            expect(repo._buildQuery({ CreationDate: { $ne: date } })).to.equal('(CreationDate != "2026-01-02T03:04:05.678Z")');
            expect(repo._buildQuery({ CreationDate: [date] })).to.equal('(CreationDate = "2026-01-02T03:04:05.678Z")');
        });

        it('should reject invalid Date values', () => {
            expect(() => repo._buildQuery({ CreationDate: { $lt: new Date('nope') } })).to.throw(RallyValidationError, /Invalid Date/);
        });

        it('should drop undefined field values silently', () => {
            const query = repo._buildQuery({ Owner: undefined, Name: 'Test' });
            expect(query).to.not.include('Owner');
            expect(query).to.include('Name');
        });

        it('should handle array values as implicit $in', () => {
            const query = repo._buildQuery({ State: ['Open', 'Closed'] });
            expect(query).to.include(' OR ');
        });

        it('should preserve non-Rally URLs in string filters', () => {
            const query = repo._buildQuery({ Description: 'https://example.com/docs/spec' });
            expect(query).to.include('(Description = "https://example.com/docs/spec")');
        });

        it('should normalize slash-delimited entity refs in filters', () => {
            const query = repo._buildQuery({ Feature: { _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/portfolioitem/feature/123' } });
            expect(query).to.include('(Feature = "/portfolioitem/feature/123")');
        });

        it('should reject invalid query field paths', () => {
            expect(() => repo._buildQuery({ 'Name) OR (State': 'Open' })).to.throw('Invalid query field path');
        });

        it('should reject invalid nested query field paths in operator clauses', () => {
            expect(() => repo._buildQuery({ 'Project.Name]': { $contains: 'Core' } })).to.throw('Invalid query field path');
        });

        it('should reject unsupported query operators', () => {
            expect(() => repo._buildQuery({ Name: { $eqq: 'Test' } })).to.throw('Unsupported query operator: $eqq');
        });
    });

    describe('Reference Handling', () => {
        let repo: any;

        beforeEach(() => {
            repo = new RallyRepository('defect', createMockClient());
        });

        it('should convert absolute refs to relative', () => {
            const rel = repo._toRelativeRef('https://rally1.rallydev.com/slm/webservice/v2.0/defect/123');
            expect(rel).to.equal('/defect/123');
        });

        it('should keep already relative refs unchanged', () => {
            const rel = repo._toRelativeRef('/defect/123');
            expect(rel).to.equal('/defect/123');
        });

        it('should preserve slash-delimited entity types when converting refs', () => {
            const rel = repo._toRelativeRef('https://rally1.rallydev.com/slm/webservice/v2.0/portfolioitem/feature/123');
            expect(rel).to.equal('/portfolioitem/feature/123');
        });
    });

    describe('Options Normalization', () => {
        let repo: any;

        beforeEach(() => {
            repo = new RallyRepository('defect', createMockClient());
        });

        it('should normalize pageSize to pagesize', () => {
            const opts = repo._normalizeOptions({ pageSize: 50 });
            expect(opts.pagesize).to.equal(50);
        });

        it('should normalize orderBy to order', () => {
            const opts = repo._normalizeOptions({ orderBy: 'Name asc' });
            expect(opts.order).to.equal('Name asc');
        });

        it('should normalize limit to maxResults', () => {
            const opts = repo._normalizeOptions({ limit: 100 });
            expect(opts.maxResults).to.equal(100);
        });

        it('should parse unified fetch with relationships', () => {
            const opts = repo._normalizeOptions({
                select: ['ObjectID', 'Name', 'Owner.DisplayName']
            });
            expect(opts.fetch).to.include('Owner');
            expect(opts.include).to.include('Owner.DisplayName');
        });

        it('should handle multiple dot-notation paths via select', () => {
            const opts = repo._normalizeOptions({
                select: ['ObjectID', 'Project.Name', 'Owner.DisplayName']
            });

            expect(opts.include).to.include('Owner.DisplayName');
            expect(opts.include).to.include('Project.Name');
        });

        it('should normalize select when passed as a comma-delimited string', () => {
            const opts = repo._normalizeOptions({
                select: 'Owner.DisplayName, Project.Name, Owner.DisplayName'
            });

            expect(opts.include).to.include('Owner.DisplayName');
            expect(opts.include).to.include('Project.Name');
        });
    });

    describe('CRUD Operations', () => {
        it('should call client.query on find', async () => {
            let called = false;
            const client = createMockClient({
                query: async () => { called = true; return [mockDefect]; }
            });
            const repo = new RallyRepository('defect', client);
            await repo.find();
            expect(called).to.equal(true);
        });

        it('should strip read-only fields on create', async () => {
            let sentData: any;
            const client = createMockClient({
                create: async (_type: string, data: any) => { sentData = data; return { ObjectID: '123', ...data }; }
            });
            const repo = new RallyRepository('defect', client);
            await repo.create({ ObjectID: '999', _ref: '/x', Name: 'Test' });
            expect(sentData).to.not.have.property('ObjectID');
            expect(sentData).to.not.have.property('_ref');
            expect(sentData.Name).to.equal('Test');
        });

        it('should call update with objectId', async () => {
            let calledId: string | undefined;
            const client = createMockClient({
                update: async (_type: string, id: string, _data: any) => { calledId = id; return { ObjectID: id }; }
            });
            const repo = new RallyRepository('defect', client);
            await repo.update('12345', { Name: 'Updated' });
            expect(calledId).to.equal('12345');
        });

        it('should send only dirty fields when saving a tracked entity', async () => {
            let sentData: any;
            const client = createMockClient({
                update: async (_type: string, id: string, data: any) => {
                    sentData = data;
                    return { ObjectID: id, ...data };
                }
            });
            const repo = new RallyRepository('defect', client, RallyEntity);
            const entity = new RallyEntity({ ObjectID: '12345', Name: 'Original', State: 'Open' });

            entity.Name = 'Updated';
            await repo.save(entity);

            expect(sentData).to.deep.equal({ Name: 'Updated' });
        });

        it('should skip the client call when a tracked entity only changed read-only fields', async () => {
            let updateCalls = 0;
            const client = createMockClient({
                update: async () => {
                    updateCalls += 1;
                    return { ObjectID: '12345' };
                }
            });
            const repo = new RallyRepository('defect', client, RallyEntity);
            const entity = new RallyEntity({ ObjectID: '12345', Name: 'Original', FormattedID: 'DE1' });

            entity.FormattedID = 'DE2';
            const result = await repo.save(entity);

            expect(updateCalls).to.equal(0);
            expect(result).to.equal(entity);
        });

        it('should call delete with objectId', async () => {
            let calledId: string | undefined;
            const client = createMockClient({
                delete: async (_type: string, id: string) => { calledId = id; return true; }
            });
            const repo = new RallyRepository('defect', client);
            const deleted = await repo.delete('12345');
            expect(calledId).to.equal('12345');
            expect(deleted).to.equal(true);
        });

        it('should propagate delete failures from the client', async () => {
            const client = createMockClient({
                delete: async () => {
                    throw new Error('Delete denied');
                }
            });
            const repo = new RallyRepository('defect', client);

            try {
                await repo.delete('12345');
                expect.fail('Expected delete to reject');
            } catch (error: any) {
                expect(String(error?.message ?? error)).to.include('Delete denied');
            }
        });

        it('should normalize slash-delimited refs during save payload preparation', async () => {
            let sentData: any;
            const client = createMockClient({
                create: async (_type: string, data: any) => { sentData = data; return { ObjectID: '123', ...data }; }
            });
            const repo = new RallyRepository('hierarchicalrequirement', client);

            await repo.save({
                Name: 'Story with feature',
                Feature: { _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/portfolioitem/feature/123' }
            });

            expect(sentData.Feature).to.deep.equal({ _ref: '/portfolioitem/feature/123' });
        });

        it('should preserve supported nested objects and arrays during save payload preparation', async () => {
            let sentData: any;
            const client = createMockClient({
                create: async (_type: string, data: any) => {
                    sentData = data;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('vsmproduct', client);

            await repo.save({
                Name: 'Product',
                SourceSystemMetaData: {
                    revision: 2,
                    owner: { _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/user/42' }
                },
                Labels: ['core', 'publish'],
                History: [{ Revision: 1, Author: { ObjectID: 99 } }]
            });

            expect(sentData).to.deep.equal({
                Name: 'Product',
                SourceSystemMetaData: {
                    revision: 2,
                    owner: { _ref: '/user/42' }
                },
                Labels: ['core', 'publish'],
                History: [{ Revision: 1, Author: { ObjectID: 99 } }]
            });
        });

        it('should preserve null fields in update payloads so callers can clear values', async () => {
            let sentData: any;
            const client = createMockClient({
                update: async (_type: string, id: string, data: any) => {
                    sentData = data;
                    return { ObjectID: id, ...data };
                }
            });
            const repo = new RallyRepository('defect', client, RallyEntity);
            const entity = new RallyEntity({ ObjectID: '12345', Name: 'Original', Owner: { _ref: '/user/1' } });

            entity.Owner = null;
            await repo.save(entity);

            expect(sentData).to.deep.equal({ Owner: null });
        });

        it('should preserve nested null values during save payload preparation', async () => {
            let sentData: any;
            const client = createMockClient({
                create: async (_type: string, data: any) => {
                    sentData = data;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            await repo.save({
                Name: 'Defect with cleared nested field',
                Metadata: {
                    owner: null,
                    revision: 2
                }
            });

            expect(sentData).to.deep.equal({
                Name: 'Defect with cleared nested field',
                Metadata: {
                    owner: null,
                    revision: 2
                }
            });
        });

        it('should fail save when string tags cannot be resolved or created', async () => {
            const client = createMockClient({
                query: async () => [],
                create: async (type: string, data: any) => {
                    if (type === 'tag') {
                        throw new Error(`Could not create tag ${data.Name}`);
                    }

                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            try {
                await repo.save({
                    Name: 'Defect with invalid tags',
                    Tags: ['BrokenTag']
                });
                expect.fail('Expected save to reject when tag creation fails');
            } catch (error: any) {
                expect(String(error?.message ?? error)).to.include('Failed to resolve or create Rally tags for defect: BrokenTag');
            }
        });

        it('should keep ref-based tags while still failing unresolved string tags', async () => {
            let entityCreateCalls = 0;
            const client = createMockClient({
                query: async () => [],
                create: async (type: string, data: any) => {
                    if (type === 'tag') {
                        throw new Error(`Could not create tag ${data.Name}`);
                    }

                    entityCreateCalls += 1;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            try {
                await repo.save({
                    Name: 'Defect with mixed tags',
                    Tags: [{ _ref: '/tag/42' }, 'BrokenTag']
                });
                expect.fail('Expected save to reject when one tag cannot be created');
            } catch (error: any) {
                expect(String(error?.message ?? error)).to.include('BrokenTag');
                expect(entityCreateCalls).to.equal(0);
            }
        });

        it('should deduplicate _ref-based tag objects in write payload', async () => {
            let entityPayload: any;
            const client = createMockClient({
                create: async (type: string, data: any) => {
                    if (type !== 'tag') { entityPayload = data; }
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            await repo.save({
                Name: 'Defect with dup tags',
                Tags: [{ _ref: '/tag/1' }, { _ref: '/tag/1' }, { _ref: '/tag/2' }]
            });

            expect(entityPayload.Tags).to.have.length(2);
            expect(entityPayload.Tags).to.deep.include({ _ref: '/tag/1' });
            expect(entityPayload.Tags).to.deep.include({ _ref: '/tag/2' });
        });

        it('should resolve existing tags, create missing tags, and preserve deduped order', async () => {
            let entityPayload: any;
            const tagCreates: string[] = [];
            const client = createMockClient({
                query: async (_type: string, options: { query?: string }) => {
                    if (options.query?.includes('ExistingTag')) {
                        return [{ _ref: '/tag/1', Name: 'ExistingTag' }];
                    }

                    if (options.query?.includes('NewTag')) {
                        return [];
                    }

                    return [];
                },
                create: async (type: string, data: any) => {
                    if (type === 'tag') {
                        tagCreates.push(data.Name);
                        return { _ref: '/tag/2', Name: data.Name };
                    }

                    entityPayload = data;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            await repo.save({
                Name: 'Defect with tags',
                Tags: ['ExistingTag', 'NewTag', 'ExistingTag']
            });

            expect(tagCreates).to.deep.equal(['NewTag']);
            expect(entityPayload.Tags).to.deep.equal([
                { _ref: '/tag/1' },
                { _ref: '/tag/2' }
            ]);
        });

        it('should recover when tag creation loses a race and the tag exists on re-read', async () => {
            let entityPayload: any;
            let tagLookupCount = 0;

            const client = createMockClient({
                query: async (_type: string, options: { query?: string }) => {
                    if (!options.query?.includes('RaceTag')) {
                        return [];
                    }

                    tagLookupCount += 1;
                    return tagLookupCount === 1
                        ? []
                        : [{ _ref: '/tag/88', Name: 'RaceTag' }];
                },
                create: async (type: string, data: any) => {
                    if (type === 'tag') {
                        throw new Error(`Duplicate tag ${data.Name}`);
                    }

                    entityPayload = data;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            await repo.save({
                Name: 'Defect with racing tag',
                Tags: ['RaceTag']
            });

            expect(tagLookupCount).to.equal(2);
            expect(entityPayload.Tags).to.deep.equal([{ _ref: '/tag/88' }]);
        });

        it('should recover when tag creation returns without _ref but the tag can be re-read', async () => {
            let entityPayload: any;
            let tagLookupCount = 0;

            const client = createMockClient({
                query: async (_type: string, options: { query?: string }) => {
                    if (!options.query?.includes('EventuallyConsistentTag')) {
                        return [];
                    }

                    tagLookupCount += 1;
                    return tagLookupCount === 1
                        ? []
                        : [{ _ref: '/tag/99', Name: 'EventuallyConsistentTag' }];
                },
                create: async (type: string, data: any) => {
                    if (type === 'tag') {
                        return { Name: data.Name };
                    }

                    entityPayload = data;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            await repo.save({
                Name: 'Defect with eventually consistent tag',
                Tags: ['EventuallyConsistentTag']
            });

            expect(tagLookupCount).to.equal(2);
            expect(entityPayload.Tags).to.deep.equal([{ _ref: '/tag/99' }]);
        });

        it('should pass normalized fetch to get and eager-load includes in findOne by id', async () => {
            const includeCalls: string[][] = [];
            const client = createMockClient({
                get: async (type: string, id: string, options: { fetch?: string }) => {
                    expect(type).to.equal('hierarchicalrequirement');
                    expect(id).to.equal('123');
                    expect(options.fetch).to.equal('ObjectID,Name,Project');
                    return { ObjectID: 123, Name: 'Story', Project: { _ref: '/project/1' } };
                }
            });
            const repo = new RallyRepository('hierarchicalrequirement', client, RallyEntity, { project: RallyEntity });

            repo.relationshipLoader.loadRelationships = async (entity: any, include: string[] = []) => {
                includeCalls.push(include);
                (entity as any).Project = { Name: 'Project 1' };
                return entity;
            };

            const entity = await repo.findOne('123', {
                select: ['ObjectID', 'Name', 'Project.Name']
            });

            expect(includeCalls).to.deep.equal([['ObjectID', 'Name', 'Project.Name']]);
            expect(entity?.ObjectID).to.equal(123);
            expect(entity?.Project.Name).to.equal('Project 1');
        });

        it('should expose eager-loaded belongsTo relations as typed models instead of LazyLink wrappers', async () => {
            class ProjectModel extends RallyEntity {
                static entityType = 'project';
            }

            class StoryModel extends RallyEntity {
                static entityType = 'hierarchicalrequirement';
                static relations = {
                    Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
                };
            }

            const client = createMockClient({
                get: async () => ({
                    ObjectID: 123,
                    Name: 'Story',
                    Project: { _ref: '/project/1' }
                })
            });

            const repo = new RallyRepository('hierarchicalrequirement', client, StoryModel, {
                project: ProjectModel,
                hierarchicalrequirement: StoryModel
            });

            repo.relationshipLoader.loadRelationships = async (entity: any) => {
                entity._data.Project = { _ref: '/project/1', _type: 'project', Name: 'Project 1' };
                return entity;
            };

            const entity = await repo.findOne('123', {
                select: ['Project.Name']
            });

            expect(entity).to.be.instanceOf(StoryModel);
            expect(entity?.Project).to.be.instanceOf(ProjectModel);
            expect(entity?.Project).to.not.be.instanceOf(LazyLink);
            expect(entity?.Project.Name).to.equal('Project 1');
            expect(entity?.toJSON().Project).to.deep.equal({ _ref: '/project/1', _type: 'project', Name: 'Project 1' });
        });
    });

    describe('Additional Coverage', () => {
        it('should delegate count to client.queryCount', async () => {
            const client = createMockClient({
                queryCount: async () => 42
            });
            const repo = new RallyRepository('defect', client);

            const result = await repo.count({});

            expect(result).to.equal(42);
        });

        it('should return false from exists when no entity matches', async () => {
            const client = createMockClient({ query: async () => [] });
            const repo = new RallyRepository('defect', client);

            const result = await repo.exists({ State: 'NonExistentState' });

            expect(result).to.equal(false);
        });

        it('should extract ObjectID from entity object in remove', async () => {
            let deletedId: string | undefined;
            const client = createMockClient({
                delete: async (_type: string, id: string) => { deletedId = id; return true; }
            });
            const repo = new RallyRepository('defect', client);

            const result = await repo.remove({ ObjectID: '99999' });

            expect(deletedId).to.equal('99999');
            expect(result).to.equal(true);
        });

        it('should throw when remove receives an object without ObjectID or id', async () => {
            const repo = new RallyRepository('defect', createMockClient());

            try {
                await repo.remove({ Name: 'No ID here' } as any);
                expect.fail('Expected remove to throw');
            } catch (error: any) {
                expect(String(error.message)).to.include('ObjectID');
            }
        });

        it('should pass raw entity data directly to create without pre-normalizing for new entities', async () => {
            let capturedPayload: any;
            const client = createMockClient({
                create: async (_type: string, data: any) => {
                    capturedPayload = data;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            await repo.save({
                Name: 'New Defect',
                Feature: { _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/portfolioitem/feature/42' }
            });

            expect(capturedPayload.Name).to.equal('New Defect');
            expect(capturedPayload.Feature).to.deep.equal({ _ref: '/portfolioitem/feature/42' });
        });

        it('should normalize select string with no dot notation to fetch field list', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;

            const opts = repo._normalizeOptions({ select: 'ObjectID,Name,State' });

            expect(opts.fetch).to.equal('ObjectID,Name,State');
            // Scalar fields are also added to include for single-segment relation discovery;
            // the smart isLeaf filter in RelationshipLoader filters them out harmlessly.
            expect(opts.include).to.include('ObjectID');
            expect(opts.include).to.include('Name');
            expect(opts.include).to.include('State');
        });

        it('should return empty arrays from _parseSelect when selectSpec is empty', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;

            const result = repo._parseSelect('');

            expect(result.fetch).to.deep.equal([]);
            expect(result.include).to.deep.equal([]);
        });

        it('should return empty includes from _normalizeOptions when select is not provided', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;

            const opts = repo._normalizeOptions({ select: 'ObjectID' });

            expect(opts.fetch).to.equal('ObjectID');
        });

        it('should strip [TypeFilter] suffixes from fetch but keep them verbatim in include', () => {
            const repo = new RallyRepository('testset', createMockClient()) as any;

            const result = repo._parseSelect(['Name', 'WorkProducts[HierarchicalRequirement].TestCases', 'WorkProducts[Defect]']);

            expect(result.fetch).to.deep.equal(['Name', 'WorkProducts']);
            expect(result.include).to.deep.equal(['Name', 'WorkProducts[HierarchicalRequirement].TestCases', 'WorkProducts[Defect]']);
        });

        it('should map the "*" wildcard to fetch=true and no eager-load paths', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;

            const opts = repo._normalizeOptions({ select: ['*', 'Owner.DisplayName'] });

            expect(opts.fetch).to.equal('true');
            expect(opts.include).to.equal(undefined);
            expect(opts.select).to.equal(undefined);
        });

        it('should drop the legacy fetch/include options instead of forwarding them to the client', async () => {
            let capturedOptions: any;
            const client = createMockClient({
                query: async (_type: string, options: any) => {
                    capturedOptions = options;
                    return [];
                }
            });
            const repo = new RallyRepository('defect', client) as any;

            await repo.find({ fetch: ['Name'], include: ['Owner.Name'], select: ['ObjectID'] });

            expect(capturedOptions.fetch).to.equal('ObjectID');
            expect(capturedOptions.include).to.equal(undefined);
        });

        it('should build the hydration include tree from plain relation names, ignoring type filters', () => {
            const repo = new RallyRepository('testset', createMockClient()) as any;

            const tree = repo._buildIncludeTree(['WorkProducts[HierarchicalRequirement].TestCases.Name', 'WorkProducts[Defect]']);

            expect(Object.keys(tree)).to.deep.equal(['WorkProducts']);
            expect(Object.keys(tree.WorkProducts.children)).to.deep.equal(['TestCases']);
            expect(Object.keys(tree.WorkProducts.children.TestCases.children)).to.deep.equal(['Name']);
        });

        it('should skip the client update call when a tracked entity has no changes at all', async () => {
            let updateCalls = 0;
            const client = createMockClient({
                update: async () => {
                    updateCalls += 1;
                    return { ObjectID: '12345' };
                }
            });
            const repo = new RallyRepository('defect', client, RallyEntity);
            const entity = new RallyEntity({ ObjectID: '12345', Name: 'Unchanged' });

            // Entity is tracked but no property has been modified
            const result = await repo.update('12345', entity);

            expect(updateCalls).to.equal(0);
            expect(result).to.equal(entity);
        });

        it('should return a fallback entity when update cleanData is empty and updateData is not a tracked entity', async () => {
            let updateCalls = 0;
            const client = createMockClient({
                update: async () => {
                    updateCalls += 1;
                    return { ObjectID: '12345' };
                }
            });
            const repo = new RallyRepository('defect', client);

            // Plain object whose only fields are read-only: after stripping they leave cleanData empty
            const result = await repo.update('12345', { _ref: '/defect/12345', FormattedID: 'DE99' });

            expect(updateCalls).to.equal(0);
            expect((result as any).ObjectID).to.equal('12345');
        });

        it('should return true from exists when an entity matches criteria', async () => {
            const client = createMockClient({ query: async () => [{ ObjectID: '1' }] });
            const repo = new RallyRepository('defect', client);

            const result = await repo.exists({ Name: 'Test' });

            expect(result).to.equal(true);
        });

        it('should pass a where query to count', async () => {
            let capturedOptions: any;
            const client = createMockClient({
                queryCount: async (_type: string, opts: any) => {
                    capturedOptions = opts;
                    return 7;
                }
            });
            const repo = new RallyRepository('defect', client);

            const result = await repo.count({ Name: 'My Defect' });

            expect(result).to.equal(7);
            expect(capturedOptions?.query).to.include('Name');
        });

        it('should warn on non-filterable fields in count()', async () => {
            const warnings: string[] = [];
            const client = createMockClient({
                queryCount: async () => 3
            });
            (client as any).logger = {
                debug: () => {},
                info: () => {},
                warn: (msg: string) => { warnings.push(msg); },
                error: () => {}
            };

            class DefectModel extends RallyEntity {
                static entityType = 'defect';
                static fields = {
                    Description: { filterable: false }
                };
            }

            const repo = new RallyRepository('defect', client, DefectModel as any);
            await repo.count({ Description: 'bug' });

            expect(warnings.some(w => w.includes('Description') && w.includes('non-filterable'))).to.equal(true);
        });

        it('should return null from findOne when the entity is not found', async () => {
            const client = createMockClient({ get: async () => null });
            const repo = new RallyRepository('defect', client);

            const result = await repo.findOne('99999');

            expect(result).to.be.null;
        });

        it('should throw on the first failing tag creation rather than attempting all tags', async () => {
            let createCalls = 0;
            const client = createMockClient({
                query: async () => [],
                create: async (type: string) => {
                    if (type === 'tag') {
                        createCalls += 1;
                        throw new Error('Tag service unavailable');
                    }
                    return { ObjectID: '123' };
                }
            });
            const repo = new RallyRepository('defect', client);

            try {
                await repo.save({
                    Name: 'Defect with 3 tags',
                    Tags: ['TagA', 'TagB', 'TagC']
                });
                expect.fail('Expected save to reject');
            } catch (error: any) {
                // Fail-fast: only 1 create call for the first tag, not 3
                expect(createCalls).to.equal(1);
                expect(String(error?.message ?? error)).to.include('Failed to resolve or create Rally tags');
            }
        });

        it('should delegate findOne with a criteria object to findOneBy', async () => {
            let capturedOptions: any;
            const client = createMockClient({
                query: async (_type: string, opts: any) => {
                    capturedOptions = opts;
                    return [{ ObjectID: '123', Name: 'Found' }];
                }
            });
            const repo = new RallyRepository('defect', client);

            const result = await repo.findOne({ Name: 'Found' });

            expect(result).to.not.be.null;
            expect(capturedOptions?.query).to.include('Name');
        });

        it('should update, not create, an entity that carries _ref but no ObjectID', async () => {
            // Typical after `select: ['Name']`: Rally returns _ref but ObjectID was not selected.
            const calls: string[] = [];
            const client = createMockClient({
                create: async () => { calls.push('create'); return { ObjectID: '999' }; },
                update: async (_type: string, id: string, data: any) => { calls.push(`update:${id}:${JSON.stringify(data)}`); return { ObjectID: id, ...data }; }
            });
            const repo = new RallyRepository('defect', client, RallyEntity);

            const loaded = new RallyEntity({ _ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/defect/123', Name: 'Original' });
            loaded.Name = 'Renamed';
            await repo.save(loaded);

            expect(calls).to.deep.equal(['update:123:{"Name":"Renamed"}']);
        });

        it('should refuse to save an entity whose _ref cannot yield an ObjectID', async () => {
            const repo = new RallyRepository('defect', createMockClient(), RallyEntity);

            try {
                await repo.save({ _ref: '/defect/not-an-id', Name: 'x' });
                expect.fail('save() should have thrown');
            } catch (error: any) {
                expect(error).to.be.instanceOf(RallyValidationError);
                expect(error.message).to.include('Cannot determine the ObjectID');
            }
        });

        it('should remove an entity identified only by its _ref', async () => {
            const deleted: string[] = [];
            const client = createMockClient({ delete: async (_type: string, id: string) => { deleted.push(id); return true; } });
            const repo = new RallyRepository('defect', client);

            await repo.remove({ _ref: '/defect/456' } as any);

            expect(deleted).to.deep.equal(['456']);
        });

        it('should resolve a Rally ref passed to findOne into a plain ObjectID', async () => {
            const gets: string[] = [];
            const client = createMockClient({ get: async (_type: string, id: string) => { gets.push(id); return { ObjectID: 123, Name: 'Loaded' }; } });
            const repo = new RallyRepository('defect', client);

            await repo.findOne('/defect/123');
            await repo.findOne('https://rally1.rallydev.com/slm/webservice/v2.0/defect/123');
            await repo.findOne('123');

            expect(gets).to.deep.equal(['123', '123', '123']);
        });

        it('should reject findOne without an id instead of returning an arbitrary entity', async () => {
            let queryCalls = 0;
            let getCalls = 0;
            const client = createMockClient({
                query: async () => { queryCalls += 1; return [{ ObjectID: '1', Name: 'First of type' }]; },
                get: async () => { getCalls += 1; return { ObjectID: '1' }; }
            });
            const repo = new RallyRepository('defect', client) as any;

            for (const missing of [undefined, null, '', '   ', [], 42n]) {
                try {
                    await repo.findOne(missing);
                    expect.fail(`findOne(${String(missing)}) should have thrown`);
                } catch (error: any) {
                    expect(error).to.be.instanceOf(RallyValidationError, `findOne(${String(missing)})`);
                    expect(error.message).to.include('requires an ObjectID or a where object');
                }
            }

            expect(queryCalls).to.equal(0);
            expect(getCalls).to.equal(0);
        });

        it('should load relationships when include is provided in find()', async () => {
            let includedPaths: string[] | undefined;
            const client = createMockClient({
                query: async () => [mockDefect]
            });
            const repo = new RallyRepository('defect', client);
            repo.relationshipLoader.loadRelationships = async (entities: any, include: string[]) => {
                includedPaths = include;
                return entities;
            };
            await repo.find({ select: ['Owner'] });
            expect(includedPaths).to.deep.equal(['Owner']);
        });

        it('should load relationships when include is provided in findBy()', async () => {
            let includedPaths: string[] | undefined;
            const client = createMockClient({
                query: async () => [mockDefect]
            });
            const repo = new RallyRepository('defect', client);
            repo.relationshipLoader.loadRelationships = async (entities: any, include: string[]) => {
                includedPaths = include;
                return entities;
            };
            await repo.findBy({ select: ['Owner'] });
            expect(includedPaths).to.deep.equal(['Owner']);
        });

        it('should throw when save is called with null', async () => {
            const repo = new RallyRepository('defect', createMockClient());
            try {
                await repo.save(null as any);
                expect.fail('Expected throw');
            } catch (e: any) {
                expect(e.message).to.include('Entity is required');
            }
        });

        it('should use entity._data when entity has _data but no toJSON method', async () => {
            let sentData: any;
            const client = createMockClient({
                create: async (_type: string, data: any) => { sentData = data; return { ObjectID: '999', ...data }; }
            });
            const repo = new RallyRepository('defect', client);
            await repo.save({ _data: { Name: 'FromData' } } as any);
            expect(sentData?.Name).to.equal('FromData');
        });

        it('should throw when create is called with null entity data', async () => {
            const repo = new RallyRepository('defect', createMockClient());
            try {
                await repo.create(null as any);
                expect.fail('Expected throw');
            } catch (e: any) {
                expect(e.message).to.include('Entity data is required');
            }
        });

        it('should throw when update is called with empty objectId', async () => {
            const repo = new RallyRepository('defect', createMockClient());
            try {
                await repo.update('' as any, {});
                expect.fail('Expected throw');
            } catch (e: any) {
                expect(e.message).to.include('ObjectID is required');
            }
        });

        it('should throw when update is called with null updateData', async () => {
            const repo = new RallyRepository('defect', createMockClient());
            try {
                await repo.update('123', null as any);
                expect.fail('Expected throw');
            } catch (e: any) {
                expect(e.message).to.include('Update data is required');
            }
        });

        it('should throw when delete is called with null objectId', async () => {
            const repo = new RallyRepository('defect', createMockClient());
            try {
                await repo.delete(null as any);
                expect.fail('Expected throw');
            } catch (e: any) {
                expect(e.message).to.include('ObjectID is required');
            }
        });

        it('should remove entity by string ID', async () => {
            let deletedId: string | undefined;
            const client = createMockClient({
                delete: async (_type: string, id: string) => { deletedId = id; return true; }
            });
            const repo = new RallyRepository('defect', client);
            const result = await repo.remove('123');
            expect(result).to.equal(true);
            expect(deletedId).to.equal('123');
        });

        it('should pass a raw string where directly through _buildQuery without parsing', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;
            expect(repo._buildQuery('(Name = "Test")')).to.equal('(Name = "Test")');
        });

        it('should return empty string from _buildQuery for non-object non-string where values', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;
            expect(repo._buildQuery(42)).to.equal('');
            expect(repo._buildQuery(false)).to.equal('');
        });
    });

    describe('3.2 Tags Partial Creation', () => {
        it('should throw after creating some tags successfully when a later tag creation fails', async () => {
            const createdTagNames: string[] = [];
            const client = createMockClient({
                query: async () => [],
                create: async (type: string, data: any) => {
                    if (type === 'tag') {
                        if (data.Name === 'TagC') {
                            throw new Error('Tag service unavailable for TagC');
                        }
                        createdTagNames.push(data.Name);
                        return { _ref: `/tag/${createdTagNames.length}`, Name: data.Name };
                    }
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            try {
                await repo.save({ Name: 'Defect', Tags: ['TagA', 'TagB', 'TagC'] });
                expect.fail('Expected throw');
            } catch (error: any) {
                // TagA and TagB were already created in Rally before TagC failed
                expect(createdTagNames).to.deep.equal(['TagA', 'TagB']);
                expect(String(error.message)).to.include('TagC');
            }
        });
    });

    describe('3.3 Branch Coverage', () => {
        it('should hydrate array values in relation cache when hydrateRelationValue receives an array', async () => {
            class TaskModel extends RallyEntity {
                static entityType = 'task';
                static relations = {};
            }
            class StoryModel extends RallyEntity {
                static entityType = 'hierarchicalrequirement';
                static relations = {
                    Children: { type: 'hasMany', entity: 'hierarchicalrequirement', foreignKey: 'Children' }
                };
            }

            const client = createMockClient({
                get: async () => ({
                    ObjectID: 1,
                    Children: [
                        { _ref: '/task/10', _type: 'task', ObjectID: 10, Name: 'Child A' },
                        { _ref: '/task/11', _type: 'task', ObjectID: 11, Name: 'Child B' }
                    ]
                })
            });
            const repo = new RallyRepository('hierarchicalrequirement', client, StoryModel, { task: TaskModel }) as any;

            // _hydrateRelationValue with an array value
            const result = repo._hydrateRelationValue(
                [{ _ref: '/task/10', Name: 'T1' }, { _ref: '/task/11', Name: 'T2' }],
                'task',
                {}
            );

            expect(Array.isArray(result)).to.equal(true);
            expect(result).to.have.length(2);
        });

        it('should return raw value from _hydrateRelationValue for a scalar non-object', () => {
            const repo = new RallyRepository('defect', createMockClient(), RallyEntity) as any;
            expect(repo._hydrateRelationValue('some-string', 'user', {})).to.equal('some-string');
            expect(repo._hydrateRelationValue(42, 'user', {})).to.equal(42);
        });

        it('should return raw value from _wrapRelatedEntity when related type is not in registry', () => {
            const repo = new RallyRepository('defect', createMockClient(), RallyEntity, {}) as any;
            const raw = { _ref: '/unknowntype/1', Name: 'Raw' };
            const result = repo._wrapRelatedEntity(raw, 'unknowntype');
            // No model registered, raw object is returned as-is
            expect(result).to.equal(raw);
        });

        it('should normalize Tags with lowercase name property to a ref object during save', async () => {
            let sentData: any;
            const client = createMockClient({
                query: async () => [],
                create: async (type: string, data: any) => {
                    if (type === 'tag') {
                        return { _ref: `/tag/99`, Name: data.Name };
                    }
                    sentData = data;
                    return { ObjectID: '123', ...data };
                }
            });
            const repo = new RallyRepository('defect', client);

            await repo.save({
                Name: 'Test',
                Tags: [{ name: 'LowercaseName' }] // lowercase .name prop
            });

            // The tag should have been looked up by name 'LowercaseName' and resolved to a ref
            expect(sentData.Tags).to.deep.equal([{ _ref: '/tag/99' }]);
        });

        it('should skip undefined items in _normalizeArrayItem', async () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;
            const result = await repo._normalizeArrayItem(undefined);
            expect(result).to.equal(undefined);
        });

        it('should normalize a nested array inside _normalizeArrayItem', async () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;
            // An array inside an array: each element should be normalized
            const result = await repo._normalizeArrayItem([{ _ref: '/user/1' }, { _ref: '/user/2' }]);
            expect(Array.isArray(result)).to.equal(true);
            expect(result).to.have.length(2);
        });

        it('should keep null $in items as an is-null match and ignore undefined ones', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;
            expect(repo._buildFieldCondition('State', { $in: [null, undefined] })).to.equal('(State = null)');
        });

        it('should treat a null-only array value as an is-null match', () => {
            const repo = new RallyRepository('defect', createMockClient()) as any;
            expect(repo._buildFieldCondition('State', [null, undefined])).to.equal('(State = null)');
        });
    });
});

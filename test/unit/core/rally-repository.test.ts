import { expect } from 'chai';
import { RallyRepository } from '../../../src/core/rally-repository.js';
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
                fetch: ['ObjectID', 'Name', 'Owner.DisplayName']
            });
            expect(opts.fetch).to.include('Owner');
            expect(opts.include).to.include('Owner.DisplayName');
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
            await repo.delete('12345');
            expect(calledId).to.equal('12345');
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
                fetch: ['ObjectID', 'Name', 'Project.Name']
            });

            expect(includeCalls).to.deep.equal([['Project.Name']]);
            expect(entity?.ObjectID).to.equal(123);
            expect(entity?.Project.Name).to.equal('Project 1');
        });
    });
});

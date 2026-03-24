import { expect } from 'chai';
import { RallyEntity } from '../../../src/models/base-entity.js';
import Artifact from '../../../src/models/base/artifact.js';
import Defect from '../../../src/models/defect.js';
import Project from '../../../src/models/project.js';

describe('RallyEntity', function () {
    this.timeout(5000);

    describe('Constructor and Proxy', () => {
        it('should store data in _data', () => {
            const entity = new RallyEntity({ Name: 'Test', ObjectID: '123' });
            expect(entity._data.Name).to.equal('Test');
        });

        it('should expose _data properties directly via Proxy', () => {
            const entity = new RallyEntity({ Name: 'Test', Description: 'A description' });
            expect(entity.Name).to.equal('Test');
            expect(entity.Description).to.equal('A description');
        });

        it('should allow setting properties through Proxy', () => {
            const entity = new RallyEntity({ Name: 'Original' });
            entity.Name = 'Updated';
            expect(entity.Name).to.equal('Updated');
            expect(entity._data.Name).to.equal('Updated');
        });

        it('should allow setting new properties', () => {
            const entity = new RallyEntity({});
            entity.CustomField = 'value';
            expect(entity.CustomField).to.equal('value');
            expect(entity._data.CustomField).to.equal('value');
        });
    });

    describe('toJSON', () => {
        it('should return a copy of _data', () => {
            const entity = new RallyEntity({ Name: 'Test', ObjectID: '123' });
            const json = entity.toJSON();
            expect(json).to.deep.equal({ Name: 'Test', ObjectID: '123' });
        });

        it('should not share reference with _data', () => {
            const entity = new RallyEntity({ Name: 'Test' });
            const json = entity.toJSON();
            json.Name = 'Modified';
            expect(entity.Name).to.equal('Test');
        });
    });

    describe('Validation', () => {
        class TestModel extends RallyEntity {
            static entityType = 'testmodel';
            static fields = {
                Name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
                Score: { type: 'number', min: 0, max: 100 },
                Status: { type: 'enum', values: ['Active', 'Inactive', 'Pending'] },
                ScheduleState: { type: 'string', enum: ['Defined', 'In-Progress', 'Completed'] },
                Enabled: { type: 'boolean', default: true },
                Rank: { type: 'integer', min: 1, max: 10 },
                Settings: { type: 'object', nullable: true },
                Labels: { type: 'array', nullable: true },
                Owner: { type: 'ref', refType: 'Project', nullable: true },
                Children: { type: 'collection', refType: 'Artifact', nullable: true }
            };
        }

        it('should apply default values declared in field metadata', () => {
            const entity = new TestModel({ Name: 'Defaulted' });
            expect(entity.Enabled).to.equal(true);
        });

        it('should validate required fields', () => {
            const entity = new TestModel({ Score: 50 });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('Name is required');
        });

        it('should validate string minLength', () => {
            const entity = new TestModel({ Name: 'A' });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors().some(e => e.includes('at least'))).to.equal(true);
        });

        it('should validate string maxLength', () => {
            const entity = new TestModel({ Name: 'A'.repeat(100) });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors().some(e => e.includes('at most'))).to.equal(true);
        });

        it('should validate number min', () => {
            const entity = new TestModel({ Name: 'Valid', Score: -1 });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors().some(e => e.includes('>= 0'))).to.equal(true);
        });

        it('should validate number max', () => {
            const entity = new TestModel({ Name: 'Valid', Score: 150 });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors().some(e => e.includes('<= 100'))).to.equal(true);
        });

        it('should validate enum values', () => {
            const entity = new TestModel({ Name: 'Valid', Status: 'Unknown' });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors().some(e => e.includes('must be one of'))).to.equal(true);
        });

        it('should validate enum arrays declared on non-enum field types', () => {
            const entity = new TestModel({ Name: 'Valid', ScheduleState: 'Invalid' });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('ScheduleState must be one of: Defined, In-Progress, Completed');
        });

        it('should validate booleans explicitly', () => {
            const entity = new TestModel({ Name: 'Valid', Enabled: 'yes' as any });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('Enabled must be a boolean');
        });

        it('should validate integers explicitly', () => {
            const entity = new TestModel({ Name: 'Valid', Rank: 1.5 });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('Rank must be an integer');
        });

        it('should validate object fields explicitly', () => {
            const entity = new TestModel({ Name: 'Valid', Settings: ['bad-shape'] as any });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('Settings must be an object');
        });

        it('should validate array fields explicitly', () => {
            const entity = new TestModel({ Name: 'Valid', Labels: { bad: true } as any });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('Labels must be an array');
        });

        it('should validate collection fields', () => {
            const entity = new TestModel({ Name: 'Valid', Children: 'bad-value' as any });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('Children must be a Rally collection or array');
        });

        it('should validate ref fields structurally', () => {
            const entity = new TestModel({ Name: 'Valid', Owner: 42 as any });
            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.include('Owner must be a Rally reference');
        });

        it('should pass validation for valid data', () => {
            const entity = new TestModel({
                Name: 'Valid Name',
                Score: 75,
                Status: 'Active',
                ScheduleState: 'Defined',
                Enabled: true,
                Rank: 3,
                Settings: { mode: 'strict' },
                Labels: ['core', 'unit'],
                Owner: { _ref: '/project/10' },
                Children: []
            });
            expect(entity.validate()).to.equal(true);
            expect(entity.getErrors()).to.have.length(0);
        });

        it('should validate refType compatibility using model inheritance', () => {
            class RefModel extends RallyEntity {
                static fields = {
                    WorkProduct: { type: 'ref', refType: 'Artifact' },
                    Project: { type: 'ref', refType: 'Project' }
                };
            }

            const entity = new RefModel({
                WorkProduct: { _ref: '/defect/123' },
                Project: { _ref: '/defect/456' }
            }, {
                dataSource: {
                    getModelRegistry: () => ({
                        artifact: Artifact,
                        defect: Defect,
                        project: Project
                    })
                } as any
            });

            expect(entity.validate()).to.equal(false);
            expect(entity.getErrors()).to.deep.equal(['Project must reference project']);
        });

        it('should validate slash-delimited ref types directly from refs', () => {
            class PortfolioRefModel extends RallyEntity {
                static fields = {
                    Feature: { type: 'ref', refType: 'PortfolioItem/Feature' }
                };
            }

            const entity = new PortfolioRefModel({
                Feature: { _ref: '/portfolioitem/feature/99' }
            });

            expect(entity.validate()).to.equal(true);
            expect(entity.getErrors()).to.have.length(0);
        });
    });
});

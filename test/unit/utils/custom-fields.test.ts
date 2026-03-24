import { expect } from 'chai';
import { extendModel, isValidCustomFieldName, createCustomFieldAccessor } from '../../../src/utils/custom-fields.js';
import { RallyEntity } from '../../../src/models/base-entity.js';

describe('custom-fields utils', () => {
    describe('isValidCustomFieldName', () => {
        it('should return true for a valid c_ prefixed name', () => {
            expect(isValidCustomFieldName('c_MyField')).to.equal(true);
        });

        it('should return true for a name with digits and underscores after c_', () => {
            expect(isValidCustomFieldName('c_MyField_123')).to.equal(true);
        });

        it('should return false for a name without c_ prefix', () => {
            expect(isValidCustomFieldName('MyField')).to.equal(false);
        });

        it('should return false for an empty string', () => {
            expect(isValidCustomFieldName('')).to.equal(false);
        });

        it('should return false for c_ alone (no trailing identifier)', () => {
            expect(isValidCustomFieldName('c_')).to.equal(false);
        });

        it('should return false when the character after c_ is a digit', () => {
            expect(isValidCustomFieldName('c_1field')).to.equal(false);
        });
    });

    describe('extendModel', () => {
        it('should create a subclass with merged fields', () => {
            class BaseModel extends RallyEntity {
                static override entityType = 'defect';
                static override fields = { Name: { type: 'string' } };
                static override relations = {};
            }

            const Extended = extendModel(BaseModel, { c_Priority: { type: 'string' } });

            expect(Extended.fields).to.have.property('Name');
            expect(Extended.fields).to.have.property('c_Priority');
        });

        it('should preserve entityType from the base class', () => {
            class BaseModel extends RallyEntity {
                static override entityType = 'defect';
                static override fields = {};
                static override relations = {};
            }

            const Extended = extendModel(BaseModel, {});

            expect(Extended.entityType).to.equal('defect');
        });

        it('should preserve relations from the base class', () => {
            class BaseModel extends RallyEntity {
                static override entityType = 'defect';
                static override fields = {};
                static override relations = { Owner: { type: 'belongsTo', entity: 'user', foreignKey: 'Owner' } };
            }

            const Extended = extendModel(BaseModel, {});

            expect(Extended.relations).to.have.property('Owner');
        });

        it('should produce a working constructor instance', () => {
            class BaseModel extends RallyEntity {
                static override entityType = 'defect';
                static override fields = {};
                static override relations = {};
            }

            const Extended = extendModel(BaseModel, { c_MyField: { type: 'string' } });
            const instance = new Extended({ Name: 'Test', c_MyField: 'custom' });

            expect((instance as any).Name).to.equal('Test');
            expect((instance as any).c_MyField).to.equal('custom');
        });

        it('should not mutate the base class fields', () => {
            class BaseModel extends RallyEntity {
                static override entityType = 'defect';
                static override fields = { Name: { type: 'string' } };
                static override relations = {};
            }

            extendModel(BaseModel, { c_Extra: { type: 'string' } });

            expect(BaseModel.fields).to.not.have.property('c_Extra');
        });
    });

    describe('createCustomFieldAccessor', () => {
        it('should proxy getter to entity getCustomField', () => {
            const entity = new RallyEntity({ c_MyField: 'value' });
            const accessor = createCustomFieldAccessor(entity);

            expect((accessor as any).c_MyField).to.equal('value');
        });

        it('should return undefined for a missing field', () => {
            const entity = new RallyEntity({});
            const accessor = createCustomFieldAccessor(entity);

            expect((accessor as any).c_Missing).to.be.undefined;
        });

        it('should proxy setter to entity setCustomField', () => {
            const entity = new RallyEntity({});
            const accessor = createCustomFieldAccessor(entity);

            (accessor as any).c_MyField = 'newValue';

            expect(entity.getCustomField('c_MyField')).to.equal('newValue');
        });

        it('should reflect updates made directly on the entity', () => {
            const entity = new RallyEntity({ c_Status: 'Open' });
            const accessor = createCustomFieldAccessor(entity);

            entity.setCustomField('c_Status', 'Closed');

            expect((accessor as any).c_Status).to.equal('Closed');
        });
    });
});

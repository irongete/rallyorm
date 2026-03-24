import { expect } from 'chai';

import { RallyDataSource } from '../../src/core/rally-datasource.js';
import AttributeDefinition from '../../src/models/metadata/attribute-definition.js';
import TypeDefinition from '../../src/models/metadata/type-definition.js';
import { createIntegrationDataSource, getIntegrationSkipReason, loadIntegrationConfig } from '../setup/integration-helpers.js';

const config = loadIntegrationConfig();
const skipReason = getIntegrationSkipReason(config);
const describeLive = skipReason ? describe.skip : describe;

describeLive('Live Rally Integration', function () {
    this.timeout(30000);

    let ds: RallyDataSource;
    let attributeDefinitionCount = 0;

    before(async () => {
        ds = createIntegrationDataSource(config);
        attributeDefinitionCount = await ds.getRepository(AttributeDefinition).count();
    });

    it('should query projects in read-only mode', async () => {
        const projects = await ds.projects.find({
            fetch: ['ObjectID', 'Name'],
            order: 'Name',
            pagesize: 3
        });

        expect(projects).to.be.an('array');

        for (const project of projects) {
            expect(project.ObjectID).to.not.equal(undefined);
            expect(project.Name).to.be.a('string');
        }
    });

    it('should count metadata entities through the repository API', async () => {
        const typeDefinitions = ds.getRepository(TypeDefinition);
        const total = await typeDefinitions.count();

        expect(total).to.be.a('number');
        expect(total).to.be.greaterThan(0);
    });

    it('should eager-load hasMany metadata relationships through fetch dot notation', async function () {
        if (attributeDefinitionCount === 0) {
            this.skip();
        }

        const typeDefinitions = await ds.getRepository(TypeDefinition).find({
            fetch: ['ObjectID', 'Name', 'Attributes.Name'],
            order: 'Name',
            pagesize: 10
        });

        expect(typeDefinitions).to.have.length.greaterThan(0);

        for (const typeDefinition of typeDefinitions) {
            expect(typeDefinition.Attributes).to.be.an('array');
        }

        const typeDefinitionWithAttributes = typeDefinitions.find(typeDefinition => typeDefinition.Attributes.length > 0);
        expect(typeDefinitionWithAttributes).to.not.equal(undefined);
        expect(typeDefinitionWithAttributes?.Attributes[0].Name).to.be.a('string');
    });

    it('should eager-load belongsTo metadata relationships through fetch dot notation', async function () {
        if (attributeDefinitionCount === 0) {
            this.skip();
        }

        const attributes = await ds.getRepository(AttributeDefinition).find({
            fetch: ['ObjectID', 'Name', 'TypeDefinition.Name'],
            order: 'Name',
            pagesize: 10
        });

        expect(attributes).to.have.length.greaterThan(0);

        const attributeWithTypeDefinition = attributes.find(attribute => attribute.TypeDefinition && attribute.TypeDefinition.Name);
        expect(attributeWithTypeDefinition).to.not.equal(undefined);
        expect(attributeWithTypeDefinition?.TypeDefinition.Name).to.be.a('string');
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
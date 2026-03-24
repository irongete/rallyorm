import { expect } from 'chai';
import { RallyDataSource } from '../../../src/core/rally-datasource.js';
import { Connection } from '../../../src/models/connection.js';
import { Project } from '../../../src/models/project.js';
import { Theme } from '../../../src/models/portfolio/theme.js';
import { Workspace } from '../../../src/models/project/workspace.js';

describe('RallyDataSource', () => {
    it('should expose a comprehensive model registry for public models', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });

        expect(dataSource.getModelRegistry()['connection']).to.equal(Connection);
        expect(dataSource.getModelRegistry()['project']).to.equal(Project);
        expect(dataSource.getModelRegistry()['workspace']).to.equal(Workspace);
        expect(dataSource.getModelRegistry()['portfolioitem/theme']).to.equal(Theme);
    });

    it('should normalize entity type strings in getRepository lookups', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });
        const repository = dataSource.getRepository('Project');

        expect(repository.entityType).to.equal('project');
        expect(repository.modelClass).to.equal(Project);
    });

    it('should reject repository lookups with unsupported inputs', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });

        expect(() => dataSource.getRepository({} as never)).to.throw('Repository requires a model class with entityType or entity type string');
    });

    it('should expose a typed repository getter for connections', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });

        expect(dataSource.connections.entityType).to.equal('connection');
        expect(dataSource.connections.modelClass).to.equal(Connection);
    });
});
import { expect } from 'chai';
import { RallyDataSource } from '../../../src/core/rally-datasource.js';
import { RallyEntity } from '../../../src/models/base-entity.js';
import { Project } from '../../../src/models/core/project.js';
import { StrategicTheme } from '../../../src/models/core/strategic-theme.js';
import { Workspace } from '../../../src/models/core/workspace.js';
import { HierarchicalRequirement } from '../../../src/models/core/hierarchical-requirement.js';
import { TestCase } from '../../../src/models/core/test-case.js';

describe('RallyDataSource', () => {
    it('should expose a comprehensive model registry for core models', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });

        expect(dataSource.getModelRegistry()['project']).to.equal(Project);
        expect(dataSource.getModelRegistry()['workspace']).to.equal(Workspace);
        expect(dataSource.getModelRegistry()['portfolioitem/strategictheme']).to.equal(StrategicTheme);
        expect(dataSource.getModelRegistry()['hierarchicalrequirement']).to.equal(HierarchicalRequirement);
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

    it('should expose typed repository getters for core entity types', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });
        const getterNames = [
            'userStories', 'defects', 'tasks', 'features', 'iterations', 'releases', 'milestones',
            'projects', 'users', 'tags', 'attachments',
            'testCases', 'testSets', 'testCaseResults', 'testCaseSteps', 'testFolders',
            'initiatives', 'themes', 'workspaces'
        ];

        for (const getter of getterNames) {
            const repo = (dataSource as any)[getter];
            expect(repo, `${getter} should return a repository`).to.exist;
            expect(typeof repo.entityType, `${getter}.entityType should be a string`).to.equal('string');
        }
    });

    it('should expose getClient() for direct client access', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });
        const client = dataSource.getClient();

        expect(client).to.exist;
        expect(typeof client.query).to.equal('function');
    });

    it('should return a different repository instance after clearCache()', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });
        const repo1 = dataSource.userStories;
        dataSource.clearCache();
        const repo2 = dataSource.userStories;

        expect(repo1).to.not.equal(repo2);
    });

    it('should accept a model class in getRepository and return correct entityType', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });
        const repo = dataSource.getRepository(Project);

        expect(repo.entityType).to.equal('project');
        expect(repo.modelClass).to.equal(Project);
    });

    it('should merge user-supplied models into the registry, overriding core models', () => {
        class CustomProject extends RallyEntity {
            static entityType = 'project';
        }

        const dataSource = new RallyDataSource({
            apiKey: 'test-key',
            models: [CustomProject as any]
        });

        expect(dataSource.getModelRegistry()['project']).to.equal(CustomProject);
    });

    it('should let built-in getters use registry overrides when generated models replace a core entity', () => {
        class CustomTestCase extends RallyEntity {
            static entityType = 'testcase';
            declare c_CustomField?: string;
        }

        const dataSource = new RallyDataSource({
            apiKey: 'test-key',
            models: [CustomTestCase as any]
        });

        expect(dataSource.testCases.modelClass).to.equal(CustomTestCase);
        expect(dataSource.getRepository('testcase').modelClass).to.equal(CustomTestCase);
    });

    it('should keep core getters on their built-in models when no override is registered', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });

        expect(dataSource.testCases.modelClass).to.equal(TestCase);
        expect(dataSource.projects.modelClass).to.equal(Project);
    });

    it('should add new entity types from user-supplied models to the registry', () => {
        class CustomEpic extends RallyEntity {
            static entityType = 'portfolioitem/epic';
        }

        const dataSource = new RallyDataSource({
            apiKey: 'test-key',
            models: [CustomEpic as any]
        });

        expect(dataSource.getModelRegistry()['portfolioitem/epic']).to.equal(CustomEpic);
        expect(dataSource.getModelRegistry()['project']).to.equal(Project);
    });

    it('should throw when models is "generated" but the generated stub is empty', () => {
        expect(() => new RallyDataSource({ apiKey: 'test-key', models: 'generated' }))
            .to.throw('No generated models found. Run `npx rallyorm generate --output=src/models/generated` first.');
    });
});
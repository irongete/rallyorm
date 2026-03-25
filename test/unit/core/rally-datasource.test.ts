import { expect } from 'chai';
import { RallyDataSource } from '../../../src/core/rally-datasource.js';
import { Project } from '../../../src/models/project.js';
import { Theme } from '../../../src/models/portfolio/theme.js';
import { Workspace } from '../../../src/models/project/workspace.js';
import { UserStory } from '../../../src/models/user-story.js';

describe('RallyDataSource', () => {
    it('should expose a comprehensive model registry for core models', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });

        expect(dataSource.getModelRegistry()['project']).to.equal(Project);
        expect(dataSource.getModelRegistry()['workspace']).to.equal(Workspace);
        expect(dataSource.getModelRegistry()['portfolioitem/theme']).to.equal(Theme);
        expect(dataSource.getModelRegistry()['hierarchicalrequirement']).to.equal(UserStory);
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
});
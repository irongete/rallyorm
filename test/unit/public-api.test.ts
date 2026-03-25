import { expect } from 'chai';
import {
    Iteration,
    Rally,
    RallyClient,
    RallyDataSource,
    RallyRepository,
    Theme,
    Workspace,
    createCustomFieldAccessor,
    extendModel,
    isValidCustomFieldName,
    UserStory,
    Project,
    Defect,
    Task
} from '../../src/index.js';

describe('Public API', () => {
    it('should expose the documented root exports', () => {
        expect(Rally).to.equal(RallyClient);
        expect(RallyClient).to.be.a('function');
        expect(RallyDataSource).to.be.a('function');
        expect(RallyRepository).to.be.a('function');
        expect(Iteration.entityType).to.equal('iteration');
        expect(Workspace.entityType).to.equal('workspace');
        expect(Theme.entityType).to.equal('portfolioitem/theme');
        expect(extendModel).to.be.a('function');
        expect(createCustomFieldAccessor).to.be.a('function');
        expect(isValidCustomFieldName('c_CustomField')).to.equal(true);
        expect(UserStory.entityType).to.equal('hierarchicalrequirement');
        expect(Defect.entityType).to.equal('defect');
        expect(Task.entityType).to.equal('task');
        expect(Project.entityType).to.equal('project');
    });

    it('should expose representative repositories and core model coverage through the root module', () => {
        const ds = new RallyDataSource({ apiKey: 'test-key' });

        expect(ds.userStories.modelClass).to.equal(UserStory);
        expect(ds.iterations.modelClass).to.equal(Iteration);
        expect(ds.projects.modelClass).to.equal(Project);
        expect(ds.defects.modelClass).to.equal(Defect);
        expect(ds.tasks.modelClass).to.equal(Task);
        expect(ds.workspaces.modelClass).to.equal(Workspace);
        expect(ds.getModelRegistry()['project']).to.equal(Project);
        expect(ds.getModelRegistry()['portfolioitem/theme']).to.equal(Theme);
    });
});
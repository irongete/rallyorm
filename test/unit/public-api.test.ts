import { expect } from 'chai';
import {

    Connection,
    Dashboard,
    FlowState,
    Iteration,
    Rally,
    RallyClient,
    RallyDataSource,
    RallyRepository,
    Theme,
    TypeDefinition,
    Workspace,
    WorkspaceConfiguration,
    createCustomFieldAccessor,
    extendModel,
    isValidCustomFieldName,
    UserStory
} from '../../src/index.js';

describe('Public API', () => {
    it('should expose the documented root exports', () => {
        expect(Rally).to.equal(RallyClient);
        expect(RallyClient).to.be.a('function');
        expect(RallyDataSource).to.be.a('function');
        expect(RallyRepository).to.be.a('function');
        expect(Connection.entityType).to.equal('connection');
        expect(Iteration.entityType).to.equal('iteration');
        expect(Workspace.entityType).to.equal('workspace');
        expect(TypeDefinition.entityType).to.equal('typedefinition');

        expect(WorkspaceConfiguration.entityType).to.equal('workspaceconfiguration');
        expect(Theme.entityType).to.equal('portfolioitem/theme');
        expect(Dashboard.entityType).to.equal('dashboard');
        expect(FlowState.entityType).to.equal('flowstate');
        expect(extendModel).to.be.a('function');
        expect(createCustomFieldAccessor).to.be.a('function');
        expect(isValidCustomFieldName('c_CustomField')).to.equal(true);
        expect(UserStory.entityType).to.equal('hierarchicalrequirement');
    });

    it('should expose representative repositories and runtime model coverage through the root module', () => {
        const ds = new RallyDataSource({ apiKey: 'test-key' });

        expect(ds.userStories.modelClass).to.equal(UserStory);
        expect(ds.iterations.modelClass).to.equal(Iteration);
        expect(ds.connections.modelClass).to.equal(Connection);
        expect(ds.getRepository('workspaceconfiguration').modelClass).to.equal(WorkspaceConfiguration);
        expect(ds.getModelRegistry()['workspaceconfiguration']).to.equal(WorkspaceConfiguration);
        expect(ds.getModelRegistry()['portfolioitem/theme']).to.equal(Theme);
    });
});
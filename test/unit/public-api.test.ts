import { expect } from 'chai';
import {
    Iteration,
    LazyLink,
    Rally,
    RallyClient,
    RallyDataSource,
    RallyRepository,
    RallyError,
    RallyValidationError,
    RallyPermissionError,
    RallyOperationError,
    RallyNetworkError,
    RallyTimeoutError,
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
import type { IFindOptions, IRallyProgressEvent, IRelationshipLoaderOptions, SelectResult } from '../../src/index.js';

describe('Public API', () => {
    it('should expose the documented root exports', () => {
        expect(Rally).to.equal(RallyClient);
        expect(RallyClient).to.be.a('function');
        expect(RallyDataSource).to.be.a('function');
        expect(RallyRepository).to.be.a('function');
        expect(Iteration.entityType).to.equal('iteration');
        expect(Workspace.entityType).to.equal('workspace');
        expect(Theme.entityType).to.equal('portfolioitem/strategictheme');
        expect(extendModel).to.be.a('function');
        expect(createCustomFieldAccessor).to.be.a('function');
        expect(isValidCustomFieldName('c_CustomField')).to.equal(true);
        expect(UserStory.entityType).to.equal('hierarchicalrequirement');
        expect(Defect.entityType).to.equal('defect');
        expect(Task.entityType).to.equal('task');
        expect(Project.entityType).to.equal('project');
        expect(LazyLink).to.be.a('function');

        // Type-only exports consumers need to annotate their own code.
        const progress: IRallyProgressEvent = { operation: 'query', current: 1, total: 2 };
        const loaderOptions: IRelationshipLoaderOptions = { maxDepth: 2 };
        const findOptions: IFindOptions = { select: ['Name'] };
        const narrowed: SelectResult<Defect, readonly ['Name']> | null = null;
        expect([progress, loaderOptions, findOptions, narrowed]).to.have.length(4);
    });

    it('should expose the error class hierarchy', () => {
        expect(RallyError).to.be.a('function');
        expect(RallyValidationError).to.be.a('function');
        expect(RallyPermissionError).to.be.a('function');
        expect(RallyOperationError).to.be.a('function');
        expect(RallyNetworkError).to.be.a('function');
        expect(RallyTimeoutError).to.be.a('function');

        const validationErr = new RallyValidationError('bad input');
        expect(validationErr).to.be.instanceOf(RallyError);
        expect(validationErr.code).to.equal('VALIDATION_ERROR');

        const operationErr = new RallyOperationError('op failed', ['E1'], ['W1']);
        expect(operationErr).to.be.instanceOf(RallyError);
        expect(operationErr.code).to.equal('OPERATION_ERROR');
        expect(operationErr.rallyErrors).to.deep.equal(['E1']);
        expect(operationErr.rallyWarnings).to.deep.equal(['W1']);

        const networkErr = new RallyNetworkError('conn refused', 503);
        expect(networkErr).to.be.instanceOf(RallyError);
        expect(networkErr.code).to.equal('NETWORK_ERROR');
        expect(networkErr.statusCode).to.equal(503);
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
        expect(ds.getModelRegistry()['portfolioitem/strategictheme']).to.equal(Theme);
    });
});
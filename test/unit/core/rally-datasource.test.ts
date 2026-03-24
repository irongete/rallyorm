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

    it('should expose typed repository getters for all entity types', () => {
        const dataSource = new RallyDataSource({ apiKey: 'test-key' });
        const getterNames = [
            'userStories', 'defects', 'tasks', 'features', 'iterations', 'releases', 'milestones',
            'projects', 'users', 'blockers', 'tags', 'attachments', 'changesets', 'builds',
            'buildDefinitions', 'testCases', 'testSets', 'testCaseResults', 'testCaseSteps',
            'testFolders', 'scheduledTestCases', 'testFolderStatuses', 'initiatives', 'themes',
            'portfolioItemFlowStates', 'portfolioItemPredecessorRelationships', 'defectSuites', 'risks',
            'hierarchicalRequirementPredecessorRelationships', 'scheduleStates', 'states',
            'scmRepositories', 'revisions', 'revisionHistories', 'changes', 'pullRequests', 'flowStates',
            'conversationPosts', 'artifactNotifications', 'workspaces', 'userProfiles', 'profileImages',
            'preferences', 'subscriptions', 'projectPermissions', 'workspacePermissions', 'subscriptionTags',
            'userIterationCapacities', 'publishedCapacityPlans', 'workingCapacityPlans', 'capacityPlanItems',
            'capacityPlanAssignments', 'capacityPlanProjects', 'expertises', 'expertiseCapacities',
            'expertiseDemands', 'objectives', 'keyResults', 'keyResultActualValues', 'keyResultInterimTargets',
            'objectiveConversationPosts', 'typeDefinitions',
            'allowedAttributeValues', 'allowedQueryOperators', 'workspaceConfigurations', 'apps', 'dashboards',
            'panels', 'pageConfigurations', 'webLinkDefinitions', 'panelDefinitionConfigProperties',
            'timeEntryItems', 'timeEntryValues', 'vsmProducts', 'vsmComponents', 'vsmChanges', 'vsmDeploys',
            'vsmIncidents', 'vsmMeasures', 'vsmOutcomes', 'vsmOutcomeMetrics', 'vsmTargets',
            'vsmMetricPortfolioItems', 'vsmProductPortfolioItems', 'vsmProductAnalyticsMetrics',
            'vsmInvestmentCategoryMaps', 'recycleBinEntries', 'investments', 'preliminaryEstimates',
            'deliveryGroups', 'featureToggleEntities', 'externalContributions', 'connectAllIntegrations',
            'ppmConnections', 'ldapConfigurations', 'keyManagementServices', 'userNotificationFilters',
            'externalSystemCredentials', 'iterationCumulativeFlowData', 'releaseCumulativeFlowData',
            'dataMoveRequests', 'attachmentContents'
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
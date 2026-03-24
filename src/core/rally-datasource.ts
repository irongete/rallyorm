import { RallyClient, type IRallyClientConfig } from './rally-client.js';
import { RallyRepository } from './rally-repository.js';
import { RallyEntity } from '../models/base-entity.js';
import { normalizeEntityType } from './ref-utils.js';
import { MODEL_REGISTRY, type RallyModelClass } from '../models/registry.js';
import { RallyValidationError } from './errors.js';

// Core artifacts
import { UserStory } from '../models/user-story.js';
import { Task } from '../models/task.js';
import { Project } from '../models/project.js';
import { Defect } from '../models/defect.js';
import { TestCase } from '../models/test-case.js';
import { TestSet } from '../models/test-set.js';
import { TestCaseResult } from '../models/test-case-result.js';
import { TestCaseStep } from '../models/test-case-step.js';
import { TestFolder } from '../models/test-folder.js';
import { User } from '../models/user.js';
import { Blocker } from '../models/blocker.js';
import { Iteration } from '../models/iteration.js';
import { Release } from '../models/release.js';
import { Attachment } from '../models/attachment.js';
import { Tag } from '../models/tag.js';
import { Build } from '../models/build.js';
import { BuildDefinition } from '../models/build-definition.js';
import { Changeset } from '../models/changeset.js';
import { Connection } from '../models/connection.js';
import { Feature } from '../models/feature.js';
import { Milestone } from '../models/milestone.js';

// Portfolio
import { Initiative } from '../models/portfolio/initiative.js';
import { Theme } from '../models/portfolio/theme.js';
import { PortfolioItemFlowState } from '../models/portfolio/portfolio-item-flow-state.js';
import { PortfolioItemPredecessorRelationship } from '../models/portfolio/portfolio-item-predecessor-relationship.js';

// Requirements & Risks
import { DefectSuite } from '../models/requirements/defect-suite.js';
import { Risk } from '../models/requirements/risk.js';
import { HierarchicalRequirementPredecessorRelationship } from '../models/requirements/hierarchical-requirement-predecessor-relationship.js';

// Planning
import { ScheduleState } from '../models/planning/schedule-state.js';
import { State } from '../models/planning/state.js';

// Test management
import { ScheduledTestCase } from '../models/test/scheduled-test-case.js';
import { TestFolderStatus } from '../models/test/test-folder-status.js';

// SCM & Build
import { Change } from '../models/scm/change.js';
import { Revision } from '../models/scm/revision.js';
import { RevisionHistory } from '../models/scm/revision-history.js';
import { SCMRepository } from '../models/scm/scm-repository.js';
import { PullRequest } from '../models/scm/pull-request.js';

// Workflow & Collaboration
import { ConversationPost } from '../models/workflow/conversation-post.js';
import { ArtifactNotification } from '../models/workflow/artifact-notification.js';
import { FlowState } from '../models/workflow/flow-state.js';

// Organization & Users
import { Workspace } from '../models/project/workspace.js';
import { UserProfile } from '../models/user/user-profile.js';
import { ProfileImage } from '../models/user/profile-image.js';
import { Preference } from '../models/user/preference.js';

// Security & Permissions
import { Subscription } from '../models/security/subscription.js';
import { ProjectPermission } from '../models/security/project-permission.js';
import { WorkspacePermission } from '../models/security/workspace-permission.js';
import { SubscriptionTag } from '../models/security/subscription-tag.js';

// Capacity Planning
import { UserIterationCapacity } from '../models/capacity/user-iteration-capacity.js';
import { PublishedCapacityPlan } from '../models/capacity/published-capacity-plan.js';
import { WorkingCapacityPlan } from '../models/capacity/working-capacity-plan.js';
import { CapacityPlanItem } from '../models/capacity/capacity-plan-item.js';
import { CapacityPlanAssignment } from '../models/capacity/capacity-plan-assignment.js';
import { CapacityPlanProject } from '../models/capacity/capacity-plan-project.js';
import { Expertise } from '../models/capacity/expertise.js';
import { ExpertiseCapacity } from '../models/capacity/expertise-capacity.js';
import { ExpertiseDemand } from '../models/capacity/expertise-demand.js';

// OKR
import { Objective } from '../models/okr/objective.js';
import { KeyResult } from '../models/okr/key-result.js';
import { KeyResultActualValue } from '../models/okr/key-result-actual-value.js';
import { KeyResultInterimTarget } from '../models/okr/key-result-interim-target.js';
import { ObjectiveConversationPost } from '../models/okr/objective-conversation-post.js';

// Metadata & Introspection
import { TypeDefinition } from '../models/metadata/type-definition.js';

import { AllowedAttributeValue } from '../models/metadata/allowed-attribute-value.js';
import { AllowedQueryOperator } from '../models/metadata/allowed-query-operator.js';
import { WorkspaceConfiguration } from '../models/metadata/workspace-configuration.js';

// Apps & Dashboards
import { App } from '../models/apps/app.js';
import { Dashboard } from '../models/apps/dashboard.js';
import { Panel } from '../models/apps/panel.js';
import { PageConfiguration } from '../models/apps/page-configuration.js';
import { WebLinkDefinition } from '../models/apps/web-link-definition.js';
import { PanelDefinitionConfigProperty } from '../models/apps/panel-definition-config-property.js';

// Time Tracking
import { TimeEntryItem } from '../models/time-tracking/time-entry-item.js';
import { TimeEntryValue } from '../models/time-tracking/time-entry-value.js';

// VSM (Value Stream Management)
import { VSMProduct } from '../models/vsm/vsm-product.js';
import { VSMComponent } from '../models/vsm/vsm-component.js';
import { VSMChange } from '../models/vsm/vsm-change.js';
import { VSMDeploy } from '../models/vsm/vsm-deploy.js';
import { VSMIncident } from '../models/vsm/vsm-incident.js';
import { VSMMeasure } from '../models/vsm/vsm-measure.js';
import { VSMOutcome } from '../models/vsm/vsm-outcome.js';
import { VSMOutcomeMetric } from '../models/vsm/vsm-outcome-metric.js';
import { VSMTarget } from '../models/vsm/vsm-target.js';
import { VSMMetricPortfolioItem } from '../models/vsm/vsm-metric-portfolio-item.js';
import { VSMProductPortfolioItem } from '../models/vsm/vsm-product-portfolio-item.js';
import { VSMProductAnalyticsMetric } from '../models/vsm/vsm-product-analytics-metric.js';
import { VSMInvestmentCategoryToInvestmentIntentMap } from '../models/vsm/vsm-investment-category-to-investment-intent-map.js';

// Advanced
import { RecycleBinEntry } from '../models/advanced/recycle-bin-entry.js';
import { Investment } from '../models/advanced/investment.js';
import { PreliminaryEstimate } from '../models/advanced/preliminary-estimate.js';
import { DeliveryGroup } from '../models/advanced/delivery-group.js';
import { FeatureToggleEntity } from '../models/advanced/feature-toggle-entity.js';
import { ExternalContribution } from '../models/advanced/external-contribution.js';

// Integration
import { ConnectAllIntegration } from '../models/integration/connect-all-integration.js';
import { PPMConnection } from '../models/integration/ppm-connection.js';
import { LdapConfiguration } from '../models/integration/ldap-configuration.js';
import { KeyManagementService } from '../models/integration/key-management-service.js';
import { UserNotificationFilter } from '../models/integration/user-notification-filter.js';
import { ExternalSystemCredential } from '../models/integration/external-system-credential.js';

// Analytics
import { IterationCumulativeFlowData } from '../models/analytics/iteration-cumulative-flow-data.js';
import { ReleaseCumulativeFlowData } from '../models/analytics/release-cumulative-flow-data.js';

// System
import { DataMoveRequest } from '../models/system/data-move-request.js';
import { AttachmentContent } from '../models/attachments/attachment-content.js';

/**
 * High-level entry point for working with Rally repositories.
 *
 * A datasource owns a single {@link RallyClient} instance and exposes cached,
 * typed repositories for the entity models included in RallyORM. It is the
 * recommended starting point for applications that want one shared client and a
 * convenient accessor for common Rally object types.
 */
export class RallyDataSource {
    readonly client: RallyClient;
    private _repositoryCache: Map<string, RallyRepository<RallyEntity>>;
    private readonly modelRegistry: Record<string, RallyModelClass>;

    /**
     * Create a datasource backed by a new {@link RallyClient} instance.
     *
     * @param clientOptions Client configuration passed directly to {@link RallyClient}.
     * @throws RallyValidationError When `clientOptions` is missing or invalid.
     */
    constructor(clientOptions: IRallyClientConfig) {
        if (!clientOptions || typeof clientOptions !== 'object') {
            throw new RallyValidationError('Client options are required');
        }

        this.client = new RallyClient(clientOptions);
        this._repositoryCache = new Map();

        this.modelRegistry = { ...MODEL_REGISTRY };
    }

    /**
     * Resolve a repository by entity type string or model class.
     *
     * @param entityTypeOrClass Model class with an `entityType` or a Rally entity type string.
     * @returns A cached repository bound to the requested entity type and model class.
     * @throws RallyValidationError When the argument is neither a model class nor an entity type string.
     * @remarks Passing a raw entity type string falls back to {@link RallyEntity} when
     * no registered model is available.
     */
    getRepository<T extends RallyEntity>(entityTypeOrClass: string | typeof RallyEntity): RallyRepository<T> {
        let entityType: string;
        let ModelClass: typeof RallyEntity;

        if (typeof entityTypeOrClass === 'function' && typeof entityTypeOrClass.entityType === 'string') {
            entityType = normalizeEntityType(entityTypeOrClass.entityType) || entityTypeOrClass.entityType;
            ModelClass = entityTypeOrClass;
        }
        else if (typeof entityTypeOrClass === 'string') {
            entityType = normalizeEntityType(entityTypeOrClass) || entityTypeOrClass;
            const registeredModel = this.modelRegistry[entityType] as typeof RallyEntity | undefined;
            if (!registeredModel) {
                this.client.logger?.warn(
                    `RallyDataSource: No model registered for "${entityType}". ` +
                    'Using base RallyEntity — field definitions, relationship metadata, and validation rules will not be available.'
                );
            }
            ModelClass = registeredModel || RallyEntity;
        }
        else {
            throw new RallyValidationError('Repository requires a model class with entityType or entity type string');
        }

        const cacheKey = `${entityType}:${ModelClass.name}`;

        if (!this._repositoryCache.has(cacheKey)) {
            this._repositoryCache.set(
                cacheKey,
                new RallyRepository(entityType, this.client, ModelClass, this.modelRegistry, this)
            );
        }

        return this._repositoryCache.get(cacheKey) as RallyRepository<T>;
    }

    /**
     * Clear the repository cache for this datasource.
     *
     * Cached repositories are recreated on the next accessor call.
     */
    clearCache(): void {
        this._repositoryCache.clear();
    }

    /**
     * Return the underlying {@link RallyClient}.
     */
    getClient(): RallyClient {
        return this.client;
    }

    /**
     * Return the registered model map used by repository resolution.
     *
     * @returns A read-only view of the datasource model registry.
     */
    getModelRegistry(): Readonly<Record<string, RallyModelClass>> {
        return this.modelRegistry;
    }

    // Core Artifacts

    /**
     * User stories (HierarchicalRequirement) repository
     */
    get userStories(): RallyRepository<UserStory> {
        return this.getRepository(UserStory);
    }

    /**
     * Defects repository
     */
    get defects(): RallyRepository<Defect> {
        return this.getRepository(Defect);
    }

    /**
     * Tasks repository
     */
    get tasks(): RallyRepository<Task> {
        return this.getRepository(Task);
    }

    /**
     * Features (PortfolioItem/Feature) repository
     */
    get features(): RallyRepository<Feature> {
        return this.getRepository(Feature);
    }

    /**
     * Iterations repository
     */
    get iterations(): RallyRepository<Iteration> {
        return this.getRepository(Iteration);
    }

    /**
     * Releases repository
     */
    get releases(): RallyRepository<Release> {
        return this.getRepository(Release);
    }

    /**
     * Milestones repository
     */
    get milestones(): RallyRepository<Milestone> {
        return this.getRepository(Milestone);
    }

    /**
     * Projects repository
     */
    get projects(): RallyRepository<Project> {
        return this.getRepository(Project);
    }

    /**
     * Users repository
     */
    get users(): RallyRepository<User> {
        return this.getRepository(User);
    }

    /**
     * Blockers repository
     */
    get blockers(): RallyRepository<Blocker> {
        return this.getRepository(Blocker);
    }

    /**
     * Tags repository
     */
    get tags(): RallyRepository<Tag> {
        return this.getRepository(Tag);
    }

    /**
     * Attachments repository
     */
    get attachments(): RallyRepository<Attachment> {
        return this.getRepository(Attachment);
    }

    /**
     * Connections repository
     */
    get connections(): RallyRepository<Connection> {
        return this.getRepository(Connection);
    }

    /**
     * Changesets repository
     */
    get changesets(): RallyRepository<Changeset> {
        return this.getRepository(Changeset);
    }

    /**
     * Builds repository
     */
    get builds(): RallyRepository<Build> {
        return this.getRepository(Build);
    }

    /**
     * Build definitions repository
     */
    get buildDefinitions(): RallyRepository<BuildDefinition> {
        return this.getRepository(BuildDefinition);
    }

    // Test Management

    /**
     * Test cases repository
     */
    get testCases(): RallyRepository<TestCase> {
        return this.getRepository(TestCase);
    }

    /**
     * Test sets repository
     */
    get testSets(): RallyRepository<TestSet> {
        return this.getRepository(TestSet);
    }

    /**
     * Test case results repository
     */
    get testCaseResults(): RallyRepository<TestCaseResult> {
        return this.getRepository(TestCaseResult);
    }

    /**
     * Test case steps repository
     */
    get testCaseSteps(): RallyRepository<TestCaseStep> {
        return this.getRepository(TestCaseStep);
    }

    /**
     * Test folders repository
     */
    get testFolders(): RallyRepository<TestFolder> {
        return this.getRepository(TestFolder);
    }

    /**
     * Scheduled test cases repository
     */
    get scheduledTestCases(): RallyRepository<ScheduledTestCase> {
        return this.getRepository(ScheduledTestCase);
    }

    /**
     * Test folder statuses repository
     */
    get testFolderStatuses(): RallyRepository<TestFolderStatus> {
        return this.getRepository(TestFolderStatus);
    }

    // Portfolio

    /**
     * Initiatives (PortfolioItem/Initiative) repository
     */
    get initiatives(): RallyRepository<Initiative> {
        return this.getRepository(Initiative);
    }

    /**
     * Themes (PortfolioItem/Theme) repository
     */
    get themes(): RallyRepository<Theme> {
        return this.getRepository(Theme);
    }

    /**
     * Portfolio item flow states repository
     */
    get portfolioItemFlowStates(): RallyRepository<PortfolioItemFlowState> {
        return this.getRepository(PortfolioItemFlowState);
    }

    /**
     * Portfolio item predecessor relationships repository
     */
    get portfolioItemPredecessorRelationships(): RallyRepository<PortfolioItemPredecessorRelationship> {
        return this.getRepository(PortfolioItemPredecessorRelationship);
    }

    // Requirements & Risks

    /**
     * Defect suites repository
     */
    get defectSuites(): RallyRepository<DefectSuite> {
        return this.getRepository(DefectSuite);
    }

    /**
     * Risks repository
     */
    get risks(): RallyRepository<Risk> {
        return this.getRepository(Risk);
    }

    /**
     * Hierarchical requirement predecessor relationships repository
     */
    get hierarchicalRequirementPredecessorRelationships(): RallyRepository<HierarchicalRequirementPredecessorRelationship> {
        return this.getRepository(HierarchicalRequirementPredecessorRelationship);
    }

    // Planning

    /**
     * Schedule states repository
     */
    get scheduleStates(): RallyRepository<ScheduleState> {
        return this.getRepository(ScheduleState);
    }

    /**
     * States repository
     */
    get states(): RallyRepository<State> {
        return this.getRepository(State);
    }

    // SCM & Build

    /**
     * SCM repositories repository
     */
    get scmRepositories(): RallyRepository<SCMRepository> {
        return this.getRepository(SCMRepository);
    }

    /**
     * Revisions repository
     */
    get revisions(): RallyRepository<Revision> {
        return this.getRepository(Revision);
    }

    /**
     * Revision histories repository
     */
    get revisionHistories(): RallyRepository<RevisionHistory> {
        return this.getRepository(RevisionHistory);
    }

    /**
     * SCM changes repository
     */
    get changes(): RallyRepository<Change> {
        return this.getRepository(Change);
    }

    /**
     * Pull requests repository
     */
    get pullRequests(): RallyRepository<PullRequest> {
        return this.getRepository(PullRequest);
    }

    // Workflow & Collaboration

    /**
     * Flow states repository
     */
    get flowStates(): RallyRepository<FlowState> {
        return this.getRepository(FlowState);
    }

    /**
     * Conversation posts repository
     */
    get conversationPosts(): RallyRepository<ConversationPost> {
        return this.getRepository(ConversationPost);
    }

    /**
     * Artifact notifications repository
     */
    get artifactNotifications(): RallyRepository<ArtifactNotification> {
        return this.getRepository(ArtifactNotification);
    }

    // Organization & Users

    /**
     * Workspaces repository
     */
    get workspaces(): RallyRepository<Workspace> {
        return this.getRepository(Workspace);
    }

    /**
     * User profiles repository
     */
    get userProfiles(): RallyRepository<UserProfile> {
        return this.getRepository(UserProfile);
    }

    /**
     * Profile images repository
     */
    get profileImages(): RallyRepository<ProfileImage> {
        return this.getRepository(ProfileImage);
    }

    /**
     * Preferences repository
     */
    get preferences(): RallyRepository<Preference> {
        return this.getRepository(Preference);
    }

    // Security & Permissions

    /**
     * Subscriptions repository
     */
    get subscriptions(): RallyRepository<Subscription> {
        return this.getRepository(Subscription);
    }

    /**
     * Project permissions repository
     */
    get projectPermissions(): RallyRepository<ProjectPermission> {
        return this.getRepository(ProjectPermission);
    }

    /**
     * Workspace permissions repository
     */
    get workspacePermissions(): RallyRepository<WorkspacePermission> {
        return this.getRepository(WorkspacePermission);
    }

    /**
     * Subscription tags repository
     */
    get subscriptionTags(): RallyRepository<SubscriptionTag> {
        return this.getRepository(SubscriptionTag);
    }

    // Capacity Planning

    /**
     * User iteration capacities repository
     */
    get userIterationCapacities(): RallyRepository<UserIterationCapacity> {
        return this.getRepository(UserIterationCapacity);
    }

    /**
     * Published capacity plans repository
     */
    get publishedCapacityPlans(): RallyRepository<PublishedCapacityPlan> {
        return this.getRepository(PublishedCapacityPlan);
    }

    /**
     * Working capacity plans repository
     */
    get workingCapacityPlans(): RallyRepository<WorkingCapacityPlan> {
        return this.getRepository(WorkingCapacityPlan);
    }

    /**
     * Capacity plan items repository
     */
    get capacityPlanItems(): RallyRepository<CapacityPlanItem> {
        return this.getRepository(CapacityPlanItem);
    }

    /**
     * Capacity plan assignments repository
     */
    get capacityPlanAssignments(): RallyRepository<CapacityPlanAssignment> {
        return this.getRepository(CapacityPlanAssignment);
    }

    /**
     * Capacity plan projects repository
     */
    get capacityPlanProjects(): RallyRepository<CapacityPlanProject> {
        return this.getRepository(CapacityPlanProject);
    }

    /**
     * Expertises repository
     */
    get expertises(): RallyRepository<Expertise> {
        return this.getRepository(Expertise);
    }

    /**
     * Expertise capacities repository
     */
    get expertiseCapacities(): RallyRepository<ExpertiseCapacity> {
        return this.getRepository(ExpertiseCapacity);
    }

    /**
     * Expertise demands repository
     */
    get expertiseDemands(): RallyRepository<ExpertiseDemand> {
        return this.getRepository(ExpertiseDemand);
    }

    // OKR (Objectives & Key Results)

    /**
     * Objectives repository
     */
    get objectives(): RallyRepository<Objective> {
        return this.getRepository(Objective);
    }

    /**
     * Key results repository
     */
    get keyResults(): RallyRepository<KeyResult> {
        return this.getRepository(KeyResult);
    }

    /**
     * Key result actual values repository
     */
    get keyResultActualValues(): RallyRepository<KeyResultActualValue> {
        return this.getRepository(KeyResultActualValue);
    }

    /**
     * Key result interim targets repository
     */
    get keyResultInterimTargets(): RallyRepository<KeyResultInterimTarget> {
        return this.getRepository(KeyResultInterimTarget);
    }

    /**
     * Objective conversation posts repository
     */
    get objectiveConversationPosts(): RallyRepository<ObjectiveConversationPost> {
        return this.getRepository(ObjectiveConversationPost);
    }

    // Metadata & Introspection

    /**
     * Type definitions repository
     */
    get typeDefinitions(): RallyRepository<TypeDefinition> {
        return this.getRepository(TypeDefinition);
    }



    /**
     * Allowed attribute values repository
     */
    get allowedAttributeValues(): RallyRepository<AllowedAttributeValue> {
        return this.getRepository(AllowedAttributeValue);
    }

    /**
     * Allowed query operators repository
     */
    get allowedQueryOperators(): RallyRepository<AllowedQueryOperator> {
        return this.getRepository(AllowedQueryOperator);
    }

    /**
     * Workspace configurations repository
     */
    get workspaceConfigurations(): RallyRepository<WorkspaceConfiguration> {
        return this.getRepository(WorkspaceConfiguration);
    }

    // Apps & Dashboards

    /**
     * Apps repository
     */
    get apps(): RallyRepository<App> {
        return this.getRepository(App);
    }

    /**
     * Dashboards repository
     */
    get dashboards(): RallyRepository<Dashboard> {
        return this.getRepository(Dashboard);
    }

    /**
     * Panels repository
     */
    get panels(): RallyRepository<Panel> {
        return this.getRepository(Panel);
    }

    /**
     * Page configurations repository
     */
    get pageConfigurations(): RallyRepository<PageConfiguration> {
        return this.getRepository(PageConfiguration);
    }

    /**
     * Web link definitions repository
     */
    get webLinkDefinitions(): RallyRepository<WebLinkDefinition> {
        return this.getRepository(WebLinkDefinition);
    }

    /**
     * Panel definition config properties repository
     */
    get panelDefinitionConfigProperties(): RallyRepository<PanelDefinitionConfigProperty> {
        return this.getRepository(PanelDefinitionConfigProperty);
    }

    // Time Tracking

    /**
     * Time entry items repository
     */
    get timeEntryItems(): RallyRepository<TimeEntryItem> {
        return this.getRepository(TimeEntryItem);
    }

    /**
     * Time entry values repository
     */
    get timeEntryValues(): RallyRepository<TimeEntryValue> {
        return this.getRepository(TimeEntryValue);
    }

    // VSM (Value Stream Management)

    /**
     * VSM products repository
     */
    get vsmProducts(): RallyRepository<VSMProduct> {
        return this.getRepository(VSMProduct);
    }

    /**
     * VSM components repository
     */
    get vsmComponents(): RallyRepository<VSMComponent> {
        return this.getRepository(VSMComponent);
    }

    /**
     * VSM changes repository
     */
    get vsmChanges(): RallyRepository<VSMChange> {
        return this.getRepository(VSMChange);
    }

    /**
     * VSM deploys repository
     */
    get vsmDeploys(): RallyRepository<VSMDeploy> {
        return this.getRepository(VSMDeploy);
    }

    /**
     * VSM incidents repository
     */
    get vsmIncidents(): RallyRepository<VSMIncident> {
        return this.getRepository(VSMIncident);
    }

    /**
     * VSM measures repository
     */
    get vsmMeasures(): RallyRepository<VSMMeasure> {
        return this.getRepository(VSMMeasure);
    }

    /**
     * VSM outcomes repository
     */
    get vsmOutcomes(): RallyRepository<VSMOutcome> {
        return this.getRepository(VSMOutcome);
    }

    /**
     * VSM outcome metrics repository
     */
    get vsmOutcomeMetrics(): RallyRepository<VSMOutcomeMetric> {
        return this.getRepository(VSMOutcomeMetric);
    }

    /**
     * VSM targets repository
     */
    get vsmTargets(): RallyRepository<VSMTarget> {
        return this.getRepository(VSMTarget);
    }

    /**
     * VSM metric portfolio items repository
     */
    get vsmMetricPortfolioItems(): RallyRepository<VSMMetricPortfolioItem> {
        return this.getRepository(VSMMetricPortfolioItem);
    }

    /**
     * VSM product portfolio items repository
     */
    get vsmProductPortfolioItems(): RallyRepository<VSMProductPortfolioItem> {
        return this.getRepository(VSMProductPortfolioItem);
    }

    /**
     * VSM product analytics metrics repository
     */
    get vsmProductAnalyticsMetrics(): RallyRepository<VSMProductAnalyticsMetric> {
        return this.getRepository(VSMProductAnalyticsMetric);
    }

    /**
     * VSM investment category to investment intent maps repository
     */
    get vsmInvestmentCategoryMaps(): RallyRepository<VSMInvestmentCategoryToInvestmentIntentMap> {
        return this.getRepository(VSMInvestmentCategoryToInvestmentIntentMap);
    }

    // Advanced

    /**
     * Recycle bin entries repository
     */
    get recycleBinEntries(): RallyRepository<RecycleBinEntry> {
        return this.getRepository(RecycleBinEntry);
    }

    /**
     * Investments repository
     */
    get investments(): RallyRepository<Investment> {
        return this.getRepository(Investment);
    }

    /**
     * Preliminary estimates repository
     */
    get preliminaryEstimates(): RallyRepository<PreliminaryEstimate> {
        return this.getRepository(PreliminaryEstimate);
    }

    /**
     * Delivery groups repository
     */
    get deliveryGroups(): RallyRepository<DeliveryGroup> {
        return this.getRepository(DeliveryGroup);
    }

    /**
     * Feature toggle entities repository
     */
    get featureToggleEntities(): RallyRepository<FeatureToggleEntity> {
        return this.getRepository(FeatureToggleEntity);
    }

    /**
     * External contributions repository
     */
    get externalContributions(): RallyRepository<ExternalContribution> {
        return this.getRepository(ExternalContribution);
    }

    // Integration

    /**
     * ConnectAll integrations repository
     */
    get connectAllIntegrations(): RallyRepository<ConnectAllIntegration> {
        return this.getRepository(ConnectAllIntegration);
    }

    /**
     * PPM connections repository
     */
    get ppmConnections(): RallyRepository<PPMConnection> {
        return this.getRepository(PPMConnection);
    }

    /**
     * LDAP configurations repository
     */
    get ldapConfigurations(): RallyRepository<LdapConfiguration> {
        return this.getRepository(LdapConfiguration);
    }

    /**
     * Key management services repository
     */
    get keyManagementServices(): RallyRepository<KeyManagementService> {
        return this.getRepository(KeyManagementService);
    }

    /**
     * User notification filters repository
     */
    get userNotificationFilters(): RallyRepository<UserNotificationFilter> {
        return this.getRepository(UserNotificationFilter);
    }

    /**
     * External system credentials repository
     */
    get externalSystemCredentials(): RallyRepository<ExternalSystemCredential> {
        return this.getRepository(ExternalSystemCredential);
    }

    // Analytics

    /**
     * Iteration cumulative flow data repository
     */
    get iterationCumulativeFlowData(): RallyRepository<IterationCumulativeFlowData> {
        return this.getRepository(IterationCumulativeFlowData);
    }

    /**
     * Release cumulative flow data repository
     */
    get releaseCumulativeFlowData(): RallyRepository<ReleaseCumulativeFlowData> {
        return this.getRepository(ReleaseCumulativeFlowData);
    }

    // System

    /**
     * Data move requests repository
     */
    get dataMoveRequests(): RallyRepository<DataMoveRequest> {
        return this.getRepository(DataMoveRequest);
    }

    /**
     * Attachment contents repository
     */
    get attachmentContents(): RallyRepository<AttachmentContent> {
        return this.getRepository(AttachmentContent);
    }
}

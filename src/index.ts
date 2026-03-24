/**
 * Public entry point for RallyORM.
 *
 * This module re-exports the primary client, repository, datasource, utility
 * helpers, and model classes that make up the published package surface.
 * Consumers typically import from this file when building typed Rally data
 * access layers or extending built-in models with custom fields.
 */

// Errors
export {
	RallyError,
	RallyValidationError,
	RallyPermissionError,
	RallyOperationError,
	RallyNetworkError,
	RallyTimeoutError
} from './core/errors.js';

// Core API
export { RallyClient as Rally, RallyClient } from './core/rally-client.js';
export type {
	IRallyClientConfig,
	IQueryOptions,
	ICollectionQueryOptions,
	IWritePermissions,
	IRallyLogger,
	IQueueOptions
} from './core/rally-client.js';
export { RallyDataSource } from './core/rally-datasource.js';
export { RallyRepository } from './core/rally-repository.js';
export type { IFindOptions } from './core/rally-repository.js';

// Utilities
export {
	extendModel,
	isValidCustomFieldName,
	createCustomFieldAccessor
} from './utils/index.js';

// Base Models
export * from './models/base/index.js';
export { RallyEntity } from './models/base-entity.js';
export type {
	IRallyEntityData,
	IRallyEntityContext,
	IFieldDefinition,
	IRelationDefinition
} from './models/base-entity.js';

// Core Artifacts (Root Level)
export { UserStory } from './models/user-story.js';
export { Defect } from './models/defect.js';
export { Task } from './models/task.js';
export { TestCase } from './models/test-case.js';
export { TestSet } from './models/test-set.js';
export { TestFolder } from './models/test-folder.js';
export { TestCaseResult } from './models/test-case-result.js';
export { TestCaseStep } from './models/test-case-step.js';
export { Feature } from './models/feature.js';
export { Iteration } from './models/iteration.js';
export { Release } from './models/release.js';
export { Milestone } from './models/milestone.js';
export { Project } from './models/project.js';
export { User } from './models/user.js';
export { Tag } from './models/tag.js';
export { Attachment } from './models/attachment.js';
export { Blocker } from './models/blocker.js';
export { Build } from './models/build.js';
export { BuildDefinition } from './models/build-definition.js';
export { Changeset } from './models/changeset.js';
export { Connection } from './models/connection.js';

// Portfolio
export { Initiative } from './models/portfolio/initiative.js';
export { Theme } from './models/portfolio/theme.js';
export { PortfolioItemFlowState } from './models/portfolio/portfolio-item-flow-state.js';
export { PortfolioItemPredecessorRelationship } from './models/portfolio/portfolio-item-predecessor-relationship.js';

// Requirements & Risks
export { DefectSuite } from './models/requirements/defect-suite.js';
export { Risk } from './models/requirements/risk.js';
export { HierarchicalRequirementPredecessorRelationship } from './models/requirements/hierarchical-requirement-predecessor-relationship.js';

// Planning & Scheduling
export { ScheduleState } from './models/planning/schedule-state.js';
export { State } from './models/planning/state.js';

// Test Management
export { TestFolderStatus } from './models/test/test-folder-status.js';
export { ScheduledTestCase } from './models/test/scheduled-test-case.js';

// SCM & Build
export { Change } from './models/scm/change.js';
export { Revision } from './models/scm/revision.js';
export { RevisionHistory } from './models/scm/revision-history.js';
export { SCMRepository } from './models/scm/scm-repository.js';
export { PullRequest } from './models/scm/pull-request.js';

// Workflow & Collaboration
export { ConversationPost } from './models/workflow/conversation-post.js';
export { ArtifactNotification } from './models/workflow/artifact-notification.js';
export { FlowState } from './models/workflow/flow-state.js';

// Organization & Users
export { Workspace } from './models/project/workspace.js';
export { UserProfile } from './models/user/user-profile.js';
export { ProfileImage } from './models/user/profile-image.js';
export { Preference } from './models/user/preference.js';

// Security & Permissions
export { Subscription } from './models/security/subscription.js';
export { ProjectPermission } from './models/security/project-permission.js';
export { WorkspacePermission } from './models/security/workspace-permission.js';
export { SubscriptionTag } from './models/security/subscription-tag.js';

// Capacity Planning
export { UserIterationCapacity } from './models/capacity/user-iteration-capacity.js';
export { PublishedCapacityPlan } from './models/capacity/published-capacity-plan.js';
export { WorkingCapacityPlan } from './models/capacity/working-capacity-plan.js';
export { CapacityPlanItem } from './models/capacity/capacity-plan-item.js';
export { CapacityPlanAssignment } from './models/capacity/capacity-plan-assignment.js';
export { CapacityPlanProject } from './models/capacity/capacity-plan-project.js';
export { Expertise } from './models/capacity/expertise.js';
export { ExpertiseCapacity } from './models/capacity/expertise-capacity.js';
export { ExpertiseDemand } from './models/capacity/expertise-demand.js';

// OKR (Objectives & Key Results)
export { Objective } from './models/okr/objective.js';
export { KeyResult } from './models/okr/key-result.js';
export { KeyResultActualValue } from './models/okr/key-result-actual-value.js';
export { KeyResultInterimTarget } from './models/okr/key-result-interim-target.js';
export { ObjectiveConversationPost } from './models/okr/objective-conversation-post.js';

// Metadata & Introspection
export { TypeDefinition } from './models/metadata/type-definition.js';
export { AttributeDefinition } from './models/metadata/attribute-definition.js';
export { ScopedAttributeDefinition } from './models/metadata/scoped-attribute-definition.js';
export { AllowedAttributeValue } from './models/metadata/allowed-attribute-value.js';
export { AllowedQueryOperator } from './models/metadata/allowed-query-operator.js';
export { WorkspaceConfiguration } from './models/metadata/workspace-configuration.js';

// Apps & Dashboards
export { App } from './models/apps/app.js';
export { Dashboard } from './models/apps/dashboard.js';
export { Panel } from './models/apps/panel.js';
export { PageConfiguration } from './models/apps/page-configuration.js';
export { WebLinkDefinition } from './models/apps/web-link-definition.js';
export { PanelDefinitionConfigProperty } from './models/apps/panel-definition-config-property.js';

// Time Tracking
export { TimeEntryItem } from './models/time-tracking/time-entry-item.js';
export { TimeEntryValue } from './models/time-tracking/time-entry-value.js';

// VSM (Value Stream Management)
export { VSMProduct } from './models/vsm/vsm-product.js';
export { VSMComponent } from './models/vsm/vsm-component.js';
export { VSMChange } from './models/vsm/vsm-change.js';
export { VSMDeploy } from './models/vsm/vsm-deploy.js';
export { VSMIncident } from './models/vsm/vsm-incident.js';
export { VSMMeasure } from './models/vsm/vsm-measure.js';
export { VSMOutcome } from './models/vsm/vsm-outcome.js';
export { VSMOutcomeMetric } from './models/vsm/vsm-outcome-metric.js';
export { VSMTarget } from './models/vsm/vsm-target.js';
export { VSMMetricPortfolioItem } from './models/vsm/vsm-metric-portfolio-item.js';
export { VSMProductPortfolioItem } from './models/vsm/vsm-product-portfolio-item.js';
export { VSMProductAnalyticsMetric } from './models/vsm/vsm-product-analytics-metric.js';
export { VSMInvestmentCategoryToInvestmentIntentMap } from './models/vsm/vsm-investment-category-to-investment-intent-map.js';

// Advanced
export { RecycleBinEntry } from './models/advanced/recycle-bin-entry.js';
export { Investment } from './models/advanced/investment.js';
export { PreliminaryEstimate } from './models/advanced/preliminary-estimate.js';
export { DeliveryGroup } from './models/advanced/delivery-group.js';
export { FeatureToggleEntity } from './models/advanced/feature-toggle-entity.js';
export { ExternalContribution } from './models/advanced/external-contribution.js';

// Integration
export { ConnectAllIntegration } from './models/integration/connect-all-integration.js';
export { PPMConnection } from './models/integration/ppm-connection.js';
export { LdapConfiguration } from './models/integration/ldap-configuration.js';
export { KeyManagementService } from './models/integration/key-management-service.js';
export { UserNotificationFilter } from './models/integration/user-notification-filter.js';
export { ExternalSystemCredential } from './models/integration/external-system-credential.js';

// Analytics
export { IterationCumulativeFlowData } from './models/analytics/iteration-cumulative-flow-data.js';
export { ReleaseCumulativeFlowData } from './models/analytics/release-cumulative-flow-data.js';

// System
export { DataMoveRequest } from './models/system/data-move-request.js';
export { AttachmentContent } from './models/attachments/attachment-content.js';


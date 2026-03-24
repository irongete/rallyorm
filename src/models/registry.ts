import type { IFieldDefinition, IRelationDefinition, RallyEntity } from './base-entity.js';

type RallyModelConstructor = abstract new (...args: any[]) => RallyEntity;

export type RallyModelClass = RallyModelConstructor & {
    entityType: string | null;
    prototype: RallyEntity;
    fields: Record<string, IFieldDefinition>;
    relations: Record<string, IRelationDefinition>;
    name: string;
};

import { Attachment } from './attachment.js';
import { Blocker } from './blocker.js';
import { BuildDefinition } from './build-definition.js';
import { Build } from './build.js';
import { Changeset } from './changeset.js';
import { Connection } from './connection.js';
import { Defect } from './defect.js';
import { Feature } from './feature.js';
import { Iteration } from './iteration.js';
import { Milestone } from './milestone.js';
import { Project } from './project.js';
import { Release } from './release.js';
import { Tag } from './tag.js';
import { Task } from './task.js';
import { TestCaseResult } from './test-case-result.js';
import { TestCaseStep } from './test-case-step.js';
import { TestCase } from './test-case.js';
import { TestFolder } from './test-folder.js';
import { TestSet } from './test-set.js';
import { UserStory } from './user-story.js';
import { User } from './user.js';
import { DeliveryGroup } from './advanced/delivery-group.js';
import { ExternalContribution } from './advanced/external-contribution.js';
import { FeatureToggleEntity } from './advanced/feature-toggle-entity.js';
import { Investment } from './advanced/investment.js';
import { PreliminaryEstimate } from './advanced/preliminary-estimate.js';
import { RecycleBinEntry } from './advanced/recycle-bin-entry.js';
import { IterationCumulativeFlowData } from './analytics/iteration-cumulative-flow-data.js';
import { ReleaseCumulativeFlowData } from './analytics/release-cumulative-flow-data.js';
import { App } from './apps/app.js';
import { Dashboard } from './apps/dashboard.js';
import { PageConfiguration } from './apps/page-configuration.js';
import { PanelDefinitionConfigProperty } from './apps/panel-definition-config-property.js';
import { Panel } from './apps/panel.js';
import { WebLinkDefinition } from './apps/web-link-definition.js';
import { AttachmentContent } from './attachments/attachment-content.js';
import { Artifact } from './base/artifact.js';
import { DomainObject } from './base/domain-object.js';
import { PersistableObject } from './base/persistable-object.js';
import { PortfolioItem } from './base/portfolio-item.js';
import { SchedulableArtifact } from './base/schedulable-artifact.js';
import { WorkspaceDomainObject } from './base/workspace-domain-object.js';
import { CapacityPlanAssignment } from './capacity/capacity-plan-assignment.js';
import { CapacityPlanItem } from './capacity/capacity-plan-item.js';
import { CapacityPlanProject } from './capacity/capacity-plan-project.js';
import { ExpertiseCapacity } from './capacity/expertise-capacity.js';
import { ExpertiseDemand } from './capacity/expertise-demand.js';
import { Expertise } from './capacity/expertise.js';
import { PublishedCapacityPlan } from './capacity/published-capacity-plan.js';
import { UserIterationCapacity } from './capacity/user-iteration-capacity.js';
import { WorkingCapacityPlan } from './capacity/working-capacity-plan.js';
import { ConnectAllIntegration } from './integration/connect-all-integration.js';
import { ExternalSystemCredential } from './integration/external-system-credential.js';
import { KeyManagementService } from './integration/key-management-service.js';
import { LdapConfiguration } from './integration/ldap-configuration.js';
import { PPMConnection } from './integration/ppm-connection.js';
import { UserNotificationFilter } from './integration/user-notification-filter.js';
import { AllowedAttributeValue } from './metadata/allowed-attribute-value.js';
import { AllowedQueryOperator } from './metadata/allowed-query-operator.js';
import { AttributeDefinition } from './metadata/attribute-definition.js';
import { ScopedAttributeDefinition } from './metadata/scoped-attribute-definition.js';
import { TypeDefinition } from './metadata/type-definition.js';
import { WorkspaceConfiguration } from './metadata/workspace-configuration.js';
import { KeyResultActualValue } from './okr/key-result-actual-value.js';
import { KeyResultInterimTarget } from './okr/key-result-interim-target.js';
import { KeyResult } from './okr/key-result.js';
import { ObjectiveConversationPost } from './okr/objective-conversation-post.js';
import { Objective } from './okr/objective.js';
import { ScheduleState } from './planning/schedule-state.js';
import { State } from './planning/state.js';
import { Initiative } from './portfolio/initiative.js';
import { PortfolioItemFlowState } from './portfolio/portfolio-item-flow-state.js';
import { PortfolioItemPredecessorRelationship } from './portfolio/portfolio-item-predecessor-relationship.js';
import { Theme } from './portfolio/theme.js';
import { Workspace } from './project/workspace.js';
import { DefectSuite } from './requirements/defect-suite.js';
import { HierarchicalRequirementPredecessorRelationship } from './requirements/hierarchical-requirement-predecessor-relationship.js';
import { Risk } from './requirements/risk.js';
import { Change } from './scm/change.js';
import { PullRequest } from './scm/pull-request.js';
import { RevisionHistory } from './scm/revision-history.js';
import { Revision } from './scm/revision.js';
import { SCMRepository } from './scm/scm-repository.js';
import { ProjectPermission } from './security/project-permission.js';
import { SubscriptionTag } from './security/subscription-tag.js';
import { Subscription } from './security/subscription.js';
import { WorkspacePermission } from './security/workspace-permission.js';
import { DataMoveRequest } from './system/data-move-request.js';
import { ScheduledTestCase } from './test/scheduled-test-case.js';
import { TestFolderStatus } from './test/test-folder-status.js';
import { TimeEntryItem } from './time-tracking/time-entry-item.js';
import { TimeEntryValue } from './time-tracking/time-entry-value.js';
import { Preference } from './user/preference.js';
import { ProfileImage } from './user/profile-image.js';
import { UserProfile } from './user/user-profile.js';
import { VSMChange } from './vsm/vsm-change.js';
import { VSMComponent } from './vsm/vsm-component.js';
import { VSMDeploy } from './vsm/vsm-deploy.js';
import { VSMIncident } from './vsm/vsm-incident.js';
import { VSMInvestmentCategoryToInvestmentIntentMap } from './vsm/vsm-investment-category-to-investment-intent-map.js';
import { VSMMeasure } from './vsm/vsm-measure.js';
import { VSMMetricPortfolioItem } from './vsm/vsm-metric-portfolio-item.js';
import { VSMOutcomeMetric } from './vsm/vsm-outcome-metric.js';
import { VSMOutcome } from './vsm/vsm-outcome.js';
import { VSMProductAnalyticsMetric } from './vsm/vsm-product-analytics-metric.js';
import { VSMProductPortfolioItem } from './vsm/vsm-product-portfolio-item.js';
import { VSMProduct } from './vsm/vsm-product.js';
import { VSMTarget } from './vsm/vsm-target.js';
import { ArtifactNotification } from './workflow/artifact-notification.js';
import { ConversationPost } from './workflow/conversation-post.js';
import { FlowState } from './workflow/flow-state.js';

export const MODEL_CLASSES: RallyModelClass[] = [
    PersistableObject,
    DomainObject,
    WorkspaceDomainObject,
    Artifact,
    SchedulableArtifact,
    PortfolioItem,
    Attachment,
    Blocker,
    BuildDefinition,
    Build,
    Changeset,
    Connection,
    Defect,
    Feature,
    Iteration,
    Milestone,
    Project,
    Release,
    Tag,
    Task,
    TestCaseResult,
    TestCaseStep,
    TestCase,
    TestFolder,
    TestSet,
    UserStory,
    User,
    DeliveryGroup,
    ExternalContribution,
    FeatureToggleEntity,
    Investment,
    PreliminaryEstimate,
    RecycleBinEntry,
    IterationCumulativeFlowData,
    ReleaseCumulativeFlowData,
    App,
    Dashboard,
    PageConfiguration,
    PanelDefinitionConfigProperty,
    Panel,
    WebLinkDefinition,
    AttachmentContent,
    CapacityPlanAssignment,
    CapacityPlanItem,
    CapacityPlanProject,
    ExpertiseCapacity,
    ExpertiseDemand,
    Expertise,
    PublishedCapacityPlan,
    UserIterationCapacity,
    WorkingCapacityPlan,
    ConnectAllIntegration,
    ExternalSystemCredential,
    KeyManagementService,
    LdapConfiguration,
    PPMConnection,
    UserNotificationFilter,
    AllowedAttributeValue,
    AllowedQueryOperator,
    AttributeDefinition,
    ScopedAttributeDefinition,
    TypeDefinition,
    WorkspaceConfiguration,
    KeyResultActualValue,
    KeyResultInterimTarget,
    KeyResult,
    ObjectiveConversationPost,
    Objective,
    ScheduleState,
    State,
    Initiative,
    PortfolioItemFlowState,
    PortfolioItemPredecessorRelationship,
    Theme,
    Workspace,
    DefectSuite,
    HierarchicalRequirementPredecessorRelationship,
    Risk,
    Change,
    PullRequest,
    RevisionHistory,
    Revision,
    SCMRepository,
    ProjectPermission,
    SubscriptionTag,
    Subscription,
    WorkspacePermission,
    DataMoveRequest,
    ScheduledTestCase,
    TestFolderStatus,
    TimeEntryItem,
    TimeEntryValue,
    Preference,
    ProfileImage,
    UserProfile,
    VSMChange,
    VSMComponent,
    VSMDeploy,
    VSMIncident,
    VSMInvestmentCategoryToInvestmentIntentMap,
    VSMMeasure,
    VSMMetricPortfolioItem,
    VSMOutcomeMetric,
    VSMOutcome,
    VSMProductAnalyticsMetric,
    VSMProductPortfolioItem,
    VSMProduct,
    VSMTarget,
    ArtifactNotification,
    ConversationPost,
    FlowState
];

export const MODEL_REGISTRY: Record<string, RallyModelClass> = MODEL_CLASSES.reduce((registry, ModelClass) => {
    if (typeof ModelClass.entityType === 'string' && ModelClass.entityType.length > 0) {
        registry[ModelClass.entityType] = ModelClass;
    }

    return registry;
}, {} as Record<string, RallyModelClass>);
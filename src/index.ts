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
export type { IRallyDataSourceOptions } from './core/rally-datasource.js';
export { RallyRepository } from './core/rally-repository.js';
export type { IFindOptions, IFindOptionsWithSelect, SelectResult } from './core/rally-repository.js';

// Utilities
export {
	extendModel,
	isValidCustomFieldName,
	createCustomFieldAccessor
} from './utils/index.js';

export { RallyEntity } from './models/base-entity.js';
export type {
	IRallyEntityData,
	IRallyEntityContext,
	IFieldDefinition,
	IRelationDefinition
} from './models/base-entity.js';

// Core Models (generated)
export { HierarchicalRequirement, HierarchicalRequirement as UserStory } from './models/core/hierarchical-requirement.js';
export { Defect } from './models/core/defect.js';
export { Task } from './models/core/task.js';
export { TestCase } from './models/core/test-case.js';
export { TestSet } from './models/core/test-set.js';
export { TestFolder } from './models/core/test-folder.js';
export { TestCaseResult } from './models/core/test-case-result.js';
export { TestCaseStep } from './models/core/test-case-step.js';
export { Feature } from './models/core/feature.js';
export { Iteration } from './models/core/iteration.js';
export { Release } from './models/core/release.js';
export { Milestone } from './models/core/milestone.js';
export { Project } from './models/core/project.js';
export { User } from './models/core/user.js';
export { Tag } from './models/core/tag.js';
export { Attachment } from './models/core/attachment.js';

// Portfolio (generated)
export { Initiative } from './models/core/initiative.js';
export { StrategicTheme, StrategicTheme as Theme } from './models/core/strategic-theme.js';

// Organization (generated)
export { Workspace } from './models/core/workspace.js';
export { WorkspaceConfiguration } from './models/core/workspace-configuration.js';


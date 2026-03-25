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

// Portfolio
export { Initiative } from './models/portfolio/initiative.js';
export { Theme } from './models/portfolio/theme.js';

// Organization
export { Workspace } from './models/project/workspace.js';


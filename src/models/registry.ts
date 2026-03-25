import type { IFieldDefinition, IRelationDefinition, RallyEntity } from './base-entity.js';

type RallyModelConstructor = abstract new (...args: any[]) => RallyEntity;

/**
 * Constructor contract used by the central Rally model registry.
 */
export type RallyModelClass = RallyModelConstructor & {
    entityType: string | null;
    prototype: RallyEntity;
    fields: Record<string, IFieldDefinition>;
    relations: Record<string, IRelationDefinition>;
    name: string;
};

import { Attachment } from './core/attachment.js';
import { Defect } from './core/defect.js';
import { Feature } from './core/feature.js';
import { HierarchicalRequirement } from './core/hierarchical-requirement.js';
import { Initiative } from './core/initiative.js';
import { Iteration } from './core/iteration.js';
import { Milestone } from './core/milestone.js';
import { Project } from './core/project.js';
import { Release } from './core/release.js';
import { StrategicTheme } from './core/strategic-theme.js';
import { Tag } from './core/tag.js';
import { Task } from './core/task.js';
import { TestCase } from './core/test-case.js';
import { TestCaseResult } from './core/test-case-result.js';
import { TestCaseStep } from './core/test-case-step.js';
import { TestFolder } from './core/test-folder.js';
import { TestSet } from './core/test-set.js';
import { User } from './core/user.js';
import { Workspace } from './core/workspace.js';

/**
 * Ordered list of all model constructors registered by RallyORM.
 *
 * This array is used to build the entity-type lookup registry and preserve a
 * single authoritative inventory of the shipped model classes.
 */
export const MODEL_CLASSES: RallyModelClass[] = [
    Attachment,
    Defect,
    Feature,
    HierarchicalRequirement,
    Initiative,
    Iteration,
    Milestone,
    Project,
    Release,
    StrategicTheme,
    Tag,
    Task,
    TestCase,
    TestCaseResult,
    TestCaseStep,
    TestFolder,
    TestSet,
    User,
    Workspace
] as unknown as RallyModelClass[];

/**
 * Lookup map from normalized Rally entity type to model constructor.
 *
 * Repositories, datasources, and relationship loaders use this registry to
 * resolve typed model classes from entity-type strings.
 */
export const MODEL_REGISTRY: Record<string, RallyModelClass> = MODEL_CLASSES.reduce((registry, ModelClass) => {
    if (typeof ModelClass.entityType === 'string' && ModelClass.entityType.length > 0) {
        registry[ModelClass.entityType] = ModelClass;
    }

    return registry;
}, {} as Record<string, RallyModelClass>);

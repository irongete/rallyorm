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

import { Attachment } from './attachment.js';
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
import { Artifact } from './base/artifact.js';
import { DomainObject } from './base/domain-object.js';
import { PersistableObject } from './base/persistable-object.js';
import { PortfolioItem } from './base/portfolio-item.js';
import { SchedulableArtifact } from './base/schedulable-artifact.js';
import { WorkspaceDomainObject } from './base/workspace-domain-object.js';
import { Initiative } from './portfolio/initiative.js';
import { Theme } from './portfolio/theme.js';
import { Workspace } from './project/workspace.js';

/**
 * Ordered list of all model constructors registered by RallyORM.
 *
 * This array is used to build the entity-type lookup registry and preserve a
 * single authoritative inventory of the shipped model classes.
 */
export const MODEL_CLASSES: RallyModelClass[] = [
    PersistableObject,
    DomainObject,
    WorkspaceDomainObject,
    Artifact,
    SchedulableArtifact,
    PortfolioItem,
    Attachment,
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
    Initiative,
    Theme,
    Workspace
];

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
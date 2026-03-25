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
import { Iteration } from '../models/iteration.js';
import { Release } from '../models/release.js';
import { Attachment } from '../models/attachment.js';
import { Tag } from '../models/tag.js';
import { Feature } from '../models/feature.js';
import { Milestone } from '../models/milestone.js';

// Portfolio
import { Initiative } from '../models/portfolio/initiative.js';
import { Theme } from '../models/portfolio/theme.js';

// Organization
import { Workspace } from '../models/project/workspace.js';

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

    // Organization

    /**
     * Workspaces repository
     */
    get workspaces(): RallyRepository<Workspace> {
        return this.getRepository(Workspace);
    }
}

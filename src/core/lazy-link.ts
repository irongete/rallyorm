import { getEntityTypeFromRef } from './ref-utils.js';
import type { IRallyLogger } from './rally-client.js';
import type { RallyEntity } from '../models/base-entity.js';
import { RallyValidationError } from './errors.js';

interface ILazyLinkRepository {
    findOne(ref: string): Promise<RallyEntity | null>;
}

interface ILazyLinkDataSource {
    client?: {
        logger?: Partial<IRallyLogger>;
    };
    getRepository(entityType: string): ILazyLinkRepository;
}

/**
 * Lazy wrapper for Rally reference objects.
 *
 * Instances hold a lightweight Rally reference and resolve the full entity on
 * demand through the surrounding datasource context.
 */
export class LazyLink {
    _ref?: string;
    _refObjectName?: string;
    _type?: string;
    private _dataSource?: ILazyLinkDataSource | null;
    [key: string]: any;

    /**
     * Create a lazy wrapper around a Rally reference object.
     */
    constructor(data: any, dataSource: ILazyLinkDataSource | null = null) {
        Object.assign(this, data);
        // Hide internal properties
        Object.defineProperty(this, '_dataSource', {
            value: dataSource,
            enumerable: false,
            writable: true
        });
    }

    /**
     * Resolve and load the referenced entity.
     *
     * @returns The loaded entity, or `null` when the reference type cannot be resolved.
     * @throws RallyValidationError When the reference or datasource context is missing.
     */
    async load(): Promise<RallyEntity | null> {
        if (!this._ref) {
            throw new RallyValidationError('[LazyLink] Cannot load: _ref is missing');
        }
        if (!this._dataSource) {
            throw new RallyValidationError(
                `[LazyLink] Cannot load ${this._ref}: no dataSource context. ` +
                'Ensure the entity was fetched through a repository or constructed with a dataSource.'
            );
        }

        const type = this._resolveEntityType();
        if (!type) {
            this._log('warn', `Could not determine entity type from ref: ${this._ref}`);
            return null;
        }

        try {
            const repo = this._dataSource.getRepository(type);
            return await repo.findOne(this._ref);
        } catch (error) {
            this._log('error', `Error loading ${this._ref}`, error);
            throw error;
        }
    }

    private _resolveEntityType(): string | null {
        if (typeof this._type === 'string' && this._type.length > 0) {
            return this._type.replace(/^\/+/, '');
        }

        return getEntityTypeFromRef(this._ref);
    }

    private _log(level: keyof Pick<IRallyLogger, 'warn' | 'error'>, message: string, error?: unknown): void {
        const logger = this._dataSource?.client?.logger;
        const method = logger?.[level];

        if (typeof method === 'function') {
            if (error !== undefined) {
                method(`[LazyLink] ${message}`, error);
                return;
            }

            method(`[LazyLink] ${message}`);
        }
    }

    /**
     * Serialize the lazy link back to its original reference payload.
     */
    toJSON(): any {
        const { _dataSource, ...data } = this;
        return data;
    }
}

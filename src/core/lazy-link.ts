import { getEntityTypeFromRef } from './ref-utils.js';
import type { IRallyLogger } from './rally-client.js';
import type { RallyEntity } from '../models/base-entity.js';

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
 * Wrapper for Rally reference objects ({ _ref: '...' })
 * Allows lazy loading of the referenced entity
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
     * Load the referenced entity
     */
    async load(): Promise<RallyEntity | null> {
        if (!this._ref || !this._dataSource) return null;

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
     * To ensure JSON serialization works as expected (returning the original data)
     */
    toJSON(): any {
        const { _dataSource, ...data } = this;
        return data;
    }
}

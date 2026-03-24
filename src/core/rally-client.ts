import PQueue from 'p-queue';
import pRetry, { AbortError } from 'p-retry';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { toAbsoluteRef, toRelativeRef } from './ref-utils.js';

export interface IQueueOptions {
    concurrency?: number;
    interval?: number;
    intervalCap?: number;
    timeout?: number;
    throwOnTimeout?: boolean;
    autoStart?: boolean;
    carryoverConcurrencyCount?: boolean;
}

export interface IRelationshipLoaderOptions {
    maxDepth?: number;
    maxCacheEntries?: number;
    inverseQueryChunkSize?: number;
}

export interface IRallyClientConfig {
    apiKey: string;
    workspace?: string;
    baseUrl?: string;
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
    authMode?: 'bearer' | 'zsessionid';
    debug?: boolean;
    logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';
    queueOptions?: IQueueOptions;
    allowCreate?: boolean;
    allowUpdate?: boolean;
    allowDelete?: boolean;
    readOnly?: boolean | null;
    relationshipLoaderOptions?: IRelationshipLoaderOptions;
    fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface IQueryOptions {
    query?: string;
    fetch?: string | string[];
    start?: number;
    pagesize?: number;
    order?: string;
    maxResults?: number;
    timeoutMs?: number;
}

export interface ICollectionQueryOptions {
    fetch?: string | string[];
    start?: number;
    pagesize?: number;
    maxResults?: number;
    timeoutMs?: number;
}

export interface IWritePermissions {
    readOnly: boolean;
    allowCreate: boolean;
    allowUpdate: boolean;
    allowDelete: boolean;
}

export interface IRallyLogger {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}

interface IRallyOperationResult {
    op: any;
    errors: string[] | null;
    warnings: string[];
    success?: boolean;
}

const PACKAGE_VERSION_CANDIDATE_PATHS = (() => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    return [
        join(__dirname, '..', '..', 'package.json'),
        join(__dirname, '..', '..', '..', 'package.json')
    ];
})();

let cachedPackageVersion: string | null = null;

interface IPQueueInstance {
    add<T>(fn: () => Promise<T>): Promise<T>;
    readonly concurrency: number;
}

/**
 * Rally API Client with repository pattern interface
 * Provides robust HTTP client with retry logic, rate limiting, and error handling
 */
export class RallyClient {
    readonly apiKey: string;
    readonly workspace?: string;
    readonly baseUrl: string;
    readonly timeoutMs: number;
    readonly retries: number;
    readonly retryDelayMs: number;
    readonly authMode: 'bearer' | 'zsessionid';
    readonly debug: boolean;
    private logLevel: string;
    readonly readOnly: boolean;
    readonly allowCreate: boolean;
    readonly allowUpdate: boolean;
    readonly allowDelete: boolean;
    private queue!: IPQueueInstance;
    logger!: IRallyLogger;
    private readonly defaultHeaders: Record<string, string>;
    fetch!: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    private _jsessionCookie: string | null;
    private _concurrencyRetries: number;
    private readonly _clientOptions: IRallyClientConfig;

    /**
     * Create a new Rally client instance
     */
    constructor(options: IRallyClientConfig) {
        this._validateOptions(options);
        this._clientOptions = { ...options };

        const cfg = this._buildConfiguration(options);
        this.apiKey = cfg.apiKey;
        this.workspace = cfg.workspace;
        this.baseUrl = cfg.baseUrl;
        this.timeoutMs = cfg.timeoutMs;
        this.retries = cfg.retries;
        this.retryDelayMs = cfg.retryDelayMs;
        this.authMode = cfg.authMode;
        this.debug = cfg.debug;
        this.fetch = cfg.fetch;
        this._jsessionCookie = null;
        this._concurrencyRetries = cfg.retries;

        this.logLevel = this._resolveLogLevel(options);
        this.logger = this._buildLogger(this.logLevel);

        const perms = this._buildPermissions(options, this.logger);
        this.readOnly = perms.readOnly;
        this.allowCreate = perms.allowCreate;
        this.allowUpdate = perms.allowUpdate;
        this.allowDelete = perms.allowDelete;

        const PQueueClass = (PQueue as any).default || PQueue;
        this.queue = new PQueueClass(this._buildQueueOptions(options)) as IPQueueInstance;

        this.defaultHeaders = this._buildHeaders(options);
    }

    /**
     * Check if a write operation is allowed
     */
    private _checkWritePermission(operation: 'create' | 'update' | 'delete', entityType: string = '') {
        const contextMsg = entityType ? ` for ${entityType}` : '';

        if (this.readOnly) {
            throw new Error(`RallyClient: ${operation.toUpperCase()} operation${contextMsg} not allowed - client is in read-only mode. ` +
                'To enable write operations, set readOnly: false and enable specific operations, or use environment variables.'
            );
        }

        switch (operation) {
            case 'create':
                if (!this.allowCreate) {
                    throw new Error(
                        `RallyClient: CREATE operation${contextMsg} not allowed. ` +
                        'Enable with allowCreate: true option or set RALLY_ALLOW_CREATE=true environment variable.'
                    );
                }
                break;
            case 'update':
                if (!this.allowUpdate) {
                    throw new Error(
                        `RallyClient: UPDATE operation${contextMsg} not allowed. ` +
                        'Enable with allowUpdate: true option or set RALLY_ALLOW_UPDATE=true environment variable.'
                    );
                }
                break;
            case 'delete':
                if (!this.allowDelete) {
                    throw new Error(
                        `RallyClient: DELETE operation${contextMsg} not allowed. ` +
                        'Enable with allowDelete: true option or set RALLY_ALLOW_DELETE=true environment variable.'
                    );
                }
                break;
            default:
                throw new Error(`RallyClient: Unknown operation type: ${operation}`);
        }
    }

    /**
     * Get current write permissions status
     */
    getWritePermissions(): IWritePermissions {
        return {
            readOnly: this.readOnly,
            allowCreate: this.allowCreate,
            allowUpdate: this.allowUpdate,
            allowDelete: this.allowDelete
        };
    }

    getRelationshipLoaderOptions(): IRelationshipLoaderOptions {
        return {
            ...(this._clientOptions.relationshipLoaderOptions || {})
        };
    }

    /**
     * Build full URL for Rally API endpoint
     */
    private _url(type: string, suffix: string = ''): string {
        const cleanType = String(type).replace(/^\//, '');
        return `${this.baseUrl}/${cleanType}${suffix}`;
    }

    /**
     * Build query parameters with workspace context
     */
    private _params(extra: Record<string, any> = {}): Record<string, any> {
        const params = { ...extra };
        if (this.workspace) {
            params.workspace = this.workspace;
        }
        return params;
    }

    /**
     * Format URL for human-friendly logging by decoding query values
     */
    private _formatUrlForLog(urlObj: URL | string): string {
        try {
            if (!(urlObj instanceof URL)) {
                urlObj = new URL(String(urlObj));
            }

            const base = `${urlObj.origin}${urlObj.pathname}`;
            if (![...urlObj.searchParams.keys()].length) {
                return base;
            }

            const pairs: string[] = [];
            urlObj.searchParams.forEach((value, key) => {
                let pretty = value;
                try {
                    pretty = decodeURIComponent(value);
                } catch (error: any) {
                    this.logger?.debug?.(`Could not decode query parameter "${key}" while formatting URL for logs:`, error.message);
                }
                pairs.push(`${key}=${pretty}`);
            });

            return `${base}?${pairs.join('&')}`;
        } catch {
            try { return urlObj.toString(); } catch { return String(urlObj); }
        }
    }

    /**
     * Execute request with retry logic and queue management
     */
    private async _requestWithRetry(taskFn: () => Promise<any>, meta: any = {}): Promise<any> {
        return this.queue.add(() =>
            pRetry(taskFn, {
                retries: this.retries,
                factor: 2,
                minTimeout: this.retryDelayMs,
                maxTimeout: this.retryDelayMs * 10,
                onFailedAttempt: (error: any) => {
                    this.logger.warn(
                        `Request failed (attempt ${error.attemptNumber}/${this.retries + 1}):`,
                        `${meta.op || 'unknown'} -`,
                        error.message
                    );
                }
            })
        );
    }

    /**
     * Perform HTTP request with JSON handling
     */
    private async _fetchJson(url: string, { method = 'GET', headers = {}, params, body, meta = {} }: { method?: string; headers?: Record<string, string>; params?: any; body?: any; meta?: any } = {}): Promise<any> {
        const requestUrl = new URL(url);

        const queryParams = this._params(params || {});
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => requestUrl.searchParams.append(key, String(v)));
                } else {
                    requestUrl.searchParams.append(key, String(value));
                }
            }
        });

        const executeRequest = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, this.timeoutMs);

            try {
                const requestConfig: RequestInit = {
                    method,
                    headers: { ...this.defaultHeaders, ...headers },
                    signal: controller.signal
                };

                if (this._jsessionCookie) {
                    const existingCookie = (requestConfig.headers as any)['Cookie'] || (requestConfig.headers as any)['cookie'];
                    const cookieHeader = existingCookie
                        ? `${existingCookie}; ${this._getCookiePair(this._jsessionCookie)}`
                        : this._getCookiePair(this._jsessionCookie);
                    (requestConfig.headers as any)['Cookie'] = cookieHeader;
                    if ((requestConfig.headers as any)['cookie']) {
                        delete (requestConfig.headers as any)['cookie'];
                    }
                }

                if (body !== undefined) {
                    if (typeof body === 'string') {
                        requestConfig.body = body;
                    } else {
                        requestConfig.body = JSON.stringify(body);
                        (requestConfig.headers as any)['Content-Type'] = 'application/json';
                    }
                }

                const response = await this.fetch(requestUrl.toString(), requestConfig);
                clearTimeout(timeoutId);

                const responseText = await response.text().catch(() => '');

                try {
                    const headers = response.headers as Headers & {
                        getSetCookie?: () => string[];
                    };
                    const setCookies = typeof headers.getSetCookie === 'function'
                        ? headers.getSetCookie()
                        : [];
                    const jsess = setCookies.find((c: string) => /^JSESSIONID=/i.test(c));
                    if (jsess && this._jsessionCookie !== jsess) {
                        this._jsessionCookie = jsess;
                        this.logger.debug('Captured JSESSIONID cookie for sticky session');
                    }
                } catch (error: any) {
                    this.logger.debug('Could not capture JSESSIONID cookie for sticky session:', error.message);
                }


                if (!response.ok) {
                    const errorMessage = `HTTP ${response.status} ${response.statusText}`;
                    this.logger.error(`${errorMessage}: ${this._formatUrlForLog(requestUrl)}`);

                    if (responseText) {
                        this.logger.debug('Response body:', responseText.slice(0, 500));
                    }

                    if (response.status === 429) {
                        const retryAfter = response.headers.get('retry-after');
                        const delayMs = retryAfter ? Number(retryAfter) * 1000 : this.retryDelayMs;

                        this.logger.warn(`Rate limited, waiting ${delayMs}ms before retry`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                        throw new Error(`Retryable: ${errorMessage}`);
                    }

                    if (response.status >= 500) {
                        throw new Error(`Retryable: ${errorMessage}`);
                    }

                    throw new AbortError(`${errorMessage}: ${responseText.slice(0, 300)}`);
                }

                this.logger.debug(`${method} ${this._formatUrlForLog(requestUrl)} [status=${response.status}]`);

                if (!responseText) {
                    return {};
                }

                try {
                    return JSON.parse(responseText);
                } catch (error: any) {
                    throw new Error(`Retryable: Invalid JSON response - ${error.message}`);
                }

            } catch (error: any) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError' || error.message.includes('timeout')) {
                    throw new Error(`Retryable: Request timeout after ${this.timeoutMs}ms`);
                }

                if (error.message.includes('fetch')) {
                    throw new Error(`Retryable: Network error - ${error.message}`);
                }

                throw error;
            }
        };

        return this._requestWithRetry(executeRequest, meta);
    }

    /**
     * Query Rally entities with pagination
     */
    async query(type: string, { query, fetch, start = 1, pagesize = 200, order }: IQueryOptions = {}): Promise<any[]> {
        if (!type || typeof type !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }

        const startIndex = this._normalizeIntegerOption(start, 'start', 1);
        const pageSize = this._normalizeIntegerOption(pagesize, 'pagesize', 1);

        const result = await this._fetchJson(this._url(type), {
            method: 'GET',
            params: { query, fetch, start: startIndex, pagesize: pageSize, order },
            meta: { op: 'query', type, start: startIndex, pagesize: pageSize }
        });

        return result?.QueryResult?.Results ?? [];
    }

    /**
     * Get only the total count of entities matching a query
     */
    async queryCount(type: string, { query }: IQueryOptions = {}): Promise<number> {
        if (!type || typeof type !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }

        const result = await this._fetchJson(this._url(type), {
            method: 'GET',
            params: { query, fetch: 'ObjectID', start: 1, pagesize: 1 },
            meta: { op: 'queryCount', type }
        });

        return result?.QueryResult?.TotalResultCount ?? 0;
    }

    /**
     * Query all Rally entities (handles pagination automatically)
     */
    async queryAll(type: string, { query, fetch, order, pagesize = 200, maxResults, timeoutMs, start = 1 }: IQueryOptions = {}): Promise<any[]> {
        if (!type || typeof type !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }

        const pageSize = this._normalizeIntegerOption(pagesize, 'pagesize', 1);
        const startIndex = this._normalizeIntegerOption(start, 'start', 1);
        const normalizedMaxResults = maxResults === undefined
            ? undefined
            : this._normalizeIntegerOption(maxResults, 'maxResults', 0);

        if (normalizedMaxResults === 0) {
            return [];
        }

        const operationDeadline = timeoutMs ? Date.now() + timeoutMs : null;

        const firstResult = await this._fetchJson(this._url(type), {
            method: 'GET',
            params: { query, fetch, start: startIndex, pagesize: pageSize, order },
            meta: { op: 'queryAll:first', type, start: startIndex }
        });

        const queryResult = firstResult?.QueryResult;
        if (!queryResult) {
            return [];
        }

        const totalCount = queryResult.TotalResultCount ?? 0;
        const results = [...(queryResult.Results || [])];

        this.logger.debug(`Found ${totalCount} total results, fetched ${results.length} in first page`);

        const remainingFromStart = Math.max(0, totalCount - (startIndex - 1));
        const effectiveMaxResults = normalizedMaxResults !== undefined
            ? Math.min(normalizedMaxResults, remainingFromStart)
            : remainingFromStart;
        if (results.length >= effectiveMaxResults) {
            return results.slice(0, effectiveMaxResults);
        }

        const remainingPages = [];
        for (let nextStart = startIndex + pageSize; (nextStart - (startIndex - 1)) <= effectiveMaxResults; nextStart += pageSize) {
            remainingPages.push(nextStart);
        }

        const batchSize = Math.max(1, (this.queue.concurrency || 10) * 2);

        for (let i = 0; i < remainingPages.length; i += batchSize) {
            if (operationDeadline && Date.now() > operationDeadline) {
                this.logger.warn(`Operation timeout reached, returning ${results.length} results`);
                break;
            }

            const batch = remainingPages.slice(i, i + batchSize);
            const pagePromises = batch.map(nextStart =>
                this._fetchJson(this._url(type), {
                    method: 'GET',
                    params: { query, fetch, start: nextStart, pagesize: pageSize, order },
                    meta: { op: 'queryAll:page', type, start: nextStart }
                }).then(data => data?.QueryResult?.Results || [])
            );

            const pages = await Promise.all(pagePromises);
            for (const page of pages) {
                results.push(...page);
                if (results.length >= effectiveMaxResults) {
                    return results.slice(0, effectiveMaxResults);
                }
            }
        }

        return results.slice(0, effectiveMaxResults);
    }

    /**
     * Get a single Rally entity by ObjectID
     */
    async get(type: string, objectId: string | number, { fetch }: Pick<IQueryOptions, 'fetch'> = {}): Promise<any> {
        if (!type || typeof type !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }
        if (!objectId) {
            throw new Error('ObjectID is required');
        }

        const result = await this._fetchJson(this._url(`${type}/${objectId}`), {
            method: 'GET',
            params: { fetch },
            meta: { op: 'get', type, objectId }
        });

        return this._extractEntityFromResponse(result, type);
    }

    /**
     * Query a Rally collection reference returned by WSAPI.
     */
    async queryCollection(collectionRef: string, { fetch, start = 1, pagesize = 200 }: ICollectionQueryOptions = {}): Promise<any[]> {
        if (!collectionRef || typeof collectionRef !== 'string') {
            throw new Error('Collection reference is required and must be a string');
        }

        const startIndex = this._normalizeIntegerOption(start, 'start', 1);
        const pageSize = this._normalizeIntegerOption(pagesize, 'pagesize', 1);

        const result = await this._queryCollectionPage(collectionRef, {
            fetch,
            start: startIndex,
            pagesize: pageSize
        });

        return result?.QueryResult?.Results ?? result?.Results ?? [];
    }

    /**
     * Query all items from a Rally collection reference.
     */
    async queryCollectionAll(collectionRef: string, { fetch, start = 1, pagesize = 200, maxResults, timeoutMs }: ICollectionQueryOptions = {}): Promise<any[]> {
        if (!collectionRef || typeof collectionRef !== 'string') {
            throw new Error('Collection reference is required and must be a string');
        }

        const startIndex = this._normalizeIntegerOption(start, 'start', 1);
        const pageSize = this._normalizeIntegerOption(pagesize, 'pagesize', 1);
        const normalizedMaxResults = maxResults === undefined
            ? undefined
            : this._normalizeIntegerOption(maxResults, 'maxResults', 0);

        if (normalizedMaxResults === 0) {
            return [];
        }

        const operationDeadline = timeoutMs ? Date.now() + timeoutMs : null;

        const firstResult = await this._queryCollectionPage(collectionRef, {
            fetch,
            start: startIndex,
            pagesize: pageSize
        });

        const queryResult = firstResult?.QueryResult;
        if (!queryResult) {
            return firstResult?.Results ?? [];
        }

        const totalCount = queryResult.TotalResultCount ?? 0;
        const results = [...(queryResult.Results || [])];
        const remainingFromStart = Math.max(0, totalCount - (startIndex - 1));
        const effectiveMaxResults = normalizedMaxResults !== undefined
            ? Math.min(normalizedMaxResults, remainingFromStart)
            : remainingFromStart;

        if (results.length >= effectiveMaxResults) {
            return results.slice(0, effectiveMaxResults);
        }

        const remainingPages = [];
        for (let nextStart = startIndex + pageSize; (nextStart - (startIndex - 1)) <= effectiveMaxResults; nextStart += pageSize) {
            remainingPages.push(nextStart);
        }

        const batchSize = Math.max(1, (this.queue.concurrency || 10) * 2);

        for (let index = 0; index < remainingPages.length; index += batchSize) {
            if (operationDeadline && Date.now() > operationDeadline) {
                this.logger.warn(`Collection query timeout reached, returning ${results.length} results`);
                break;
            }

            const batch = remainingPages.slice(index, index + batchSize);
            const pages = await Promise.all(batch.map(nextStart =>
                this._queryCollectionPage(collectionRef, {
                    fetch,
                    start: nextStart,
                    pagesize: pageSize
                }).then(data => data?.QueryResult?.Results ?? data?.Results ?? [])
            ));

            for (const page of pages) {
                results.push(...page);
                if (results.length >= effectiveMaxResults) {
                    return results.slice(0, effectiveMaxResults);
                }
            }
        }

        return results.slice(0, effectiveMaxResults);
    }

    private async _queryCollectionPage(collectionRef: string, { fetch, start, pagesize }: Required<Pick<ICollectionQueryOptions, 'start' | 'pagesize'>> & Pick<ICollectionQueryOptions, 'fetch'>): Promise<any> {
        const startIndex = this._normalizeIntegerOption(start, 'start', 1);
        const pageSize = this._normalizeIntegerOption(pagesize, 'pagesize', 1);

        const relativeRef = toRelativeRef(collectionRef, this.baseUrl);
        const absoluteRef = toAbsoluteRef(relativeRef || collectionRef, this.baseUrl) || collectionRef;

        return this._fetchJson(absoluteRef, {
            method: 'GET',
            params: { fetch, start: startIndex, pagesize: pageSize },
            meta: { op: 'queryCollection', ref: relativeRef || collectionRef, start: startIndex, pagesize: pageSize }
        });
    }

    /**
     * Create a new Rally entity
     */
    async create(type: string, payload: any): Promise<any> {
        this._checkWritePermission('create', type);

        if (!type || typeof type !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }
        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload is required and must be an object');
        }

        this.logger.warn(`Creating new ${type} entity`);

        const entityKey = this._getEntityKey(type);

        const result = await this._performWithConcurrencyRetry(
            `create:${type}`,
            () => this._fetchJson(this._url(`${type}/create`), {
                method: 'POST',
                body: { [entityKey]: payload },
                meta: { op: 'create', type }
            })
        );

        this._logAndHandleOperation('create', type, undefined, result, { throwOnErrors: true });

        const createdEntity = this._extractEntityFromResponse(result, type);
        this.logger.info(`Successfully created ${type} with ObjectID: ${createdEntity?.ObjectID}`);

        return createdEntity;
    }

    /**
     * Update an existing Rally entity
     */
    async update(type: string, objectId: string | number, payload: any): Promise<any> {
        this._checkWritePermission('update', type);

        if (!type || typeof type !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }
        if (!objectId) {
            throw new Error('ObjectID is required');
        }
        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload is required and must be an object');
        }

        this.logger.warn(`Updating ${type} entity ${objectId}`);

        const entityKey = this._getEntityKey(type);

        const result = await this._performWithConcurrencyRetry(
            `update:${type}:${objectId}`,
            () => this._fetchJson(this._url(`${type}/${objectId}`), {
                method: 'POST',
                body: { [entityKey]: payload },
                meta: { op: 'update', type, objectId }
            })
        );

        this._logAndHandleOperation('update', type, objectId, result, { throwOnErrors: true });

        const updatedEntity = this._extractEntityFromResponse(result, type);
        this.logger.info(`Successfully updated ${type} ${objectId}`);

        return updatedEntity;
    }

    /**
     * Delete a Rally entity
     */
    async delete(type: string, objectId: string | number): Promise<boolean> {
        this._checkWritePermission('delete', type);

        if (!type || typeof type !== 'string') {
            throw new Error('Entity type is required and must be a string');
        }
        if (!objectId) {
            throw new Error('ObjectID is required');
        }

        this.logger.warn(`Deleting ${type} entity ${objectId}`);

        const result = await this._performWithConcurrencyRetry(
            `delete:${type}:${objectId}`,
            () => this._fetchJson(this._url(`${type}/${objectId}`), {
                method: 'DELETE',
                meta: { op: 'delete', type, objectId }
            })
        );

        const { success } = this._logAndHandleOperation('delete', type, objectId, result, { throwOnErrors: true });

        return success || false;
    }

    /**
     * Analyze a Rally response for OperationResult/CreateResult/DeleteResult arrays
     */
    private _analyzeOperationResult(result: any): IRallyOperationResult {
        const op = result?.OperationResult || result?.CreateResult || result?.DeleteResult || null;
        const errors = Array.isArray(op?.Errors)
            ? op.Errors
            : (Array.isArray(result?.Errors) ? result.Errors : null);
        const warnings = Array.isArray(op?.Warnings)
            ? op.Warnings
            : (Array.isArray(result?.Warnings) ? result.Warnings : []);
        return { op, errors, warnings };
    }

    private _hasStructuredEntityPayload(result: any, type: string): boolean {
        if (!result || typeof result !== 'object') {
            return false;
        }

        if (result.CreateResult?.Object || result.OperationResult?.Object || result.Object) {
            return true;
        }

        const entityKey = this._getEntityKey(type);
        if (result[entityKey]) {
            return true;
        }

        const normalizedEntityKey = entityKey.toLowerCase();
        const lastEntitySegment = normalizedEntityKey.split('/').pop() || normalizedEntityKey;

        return Object.keys(result).some(responseKey => {
            const normalizedResponseKey = String(responseKey).toLowerCase();
            return normalizedResponseKey === normalizedEntityKey || normalizedResponseKey === lastEntitySegment;
        });
    }

    private _resolveOperationSuccess(action: 'create' | 'update' | 'delete', type: string, result: any, op: any, errors: string[] | null): boolean {
        if (Array.isArray(errors) && errors.length > 0) {
            return false;
        }

        const explicitSuccess = [op?.Success, result?.Success].find(value => typeof value === 'boolean');
        if (explicitSuccess === false) {
            return false;
        }

        if (explicitSuccess === true) {
            return true;
        }

        if (action === 'delete') {
            return Boolean(result?.DeleteResult || result?.OperationResult);
        }

        return this._hasStructuredEntityPayload(result, type);
    }

    /**
     * Unified OperationResult logging and error handling
     */
    private _logAndHandleOperation(action: 'create' | 'update' | 'delete', type: string, objectId: string | number | undefined, result: any, { throwOnErrors = false } = {}): IRallyOperationResult {
        const { op, errors, warnings } = this._analyzeOperationResult(result);
        const success = this._resolveOperationSuccess(action, type, result, op, errors);

        this.logger.debug(`[${action}:${type}] opResult: errors=${Array.isArray(errors) ? errors.length : 'n/a'} warnings=${warnings.length} success=${success}`);

        const actionLabel = `${action.charAt(0).toUpperCase() + action.slice(1)} ${type}${objectId ? ` ${objectId}` : ''}`;
        if (Array.isArray(errors) && errors.length > 0) {
            this.logger.error(`${actionLabel} returned errors:`, errors);
            if (throwOnErrors) {
                throw new Error(`Rally ${action} failed for ${type}${objectId ? ` ${objectId}` : ''}: ${errors.join(' | ')}`);
            }
        } else if (!success) {
            const message = `Rally ${action} failed for ${type}${objectId ? ` ${objectId}` : ''}: response did not confirm success`;
            this.logger.error(message, result);
            if (throwOnErrors) {
                throw new Error(message);
            }
        } else if (warnings.length > 0) {
            this.logger.warn(`${actionLabel} returned warnings:`, warnings);
        }

        return { op, errors, warnings, success };
    }

    /**
     * Get Rally entity key for API requests
     */
    private _getEntityKey(type: string): string {
        return type;
    }

    /**
     * Extract entity from Rally API response
     */
    private _extractEntityFromResponse(response: any, type: string): any {
        if (!response || typeof response !== 'object') {
            return response;
        }

        if (response.CreateResult?.Object) {
            return response.CreateResult.Object;
        }

        if (response.OperationResult?.Object) {
            return response.OperationResult.Object;
        }

        if (response.Object) {
            return response.Object;
        }

        const entityKey = this._getEntityKey(type);
        if (response[entityKey]) {
            return response[entityKey];
        }

        const normalizedEntityKey = entityKey.toLowerCase();
        const lastEntitySegment = normalizedEntityKey.split('/').pop() || normalizedEntityKey;

        for (const [responseKey, value] of Object.entries(response)) {
            const normalizedResponseKey = String(responseKey).toLowerCase();

            if (normalizedResponseKey === normalizedEntityKey || normalizedResponseKey === lastEntitySegment) {
                return value;
            }
        }

        return response;
    }

    /**
     * Determine if OperationResult errors indicate a concurrency conflict
     */
    private _isConcurrencyConflict(errors: any[] | null): boolean {
        if (!Array.isArray(errors)) {
            return false;
        }
        const pattern = /(Concurrency\s*conflict|ConcurrencyConflictException|Modified since read|has been modified since being read)/i;
        return errors.some(e => pattern.test(String(e)));
    }

    /**
     * Run a write operation and retry when Rally reports a concurrency conflict in OperationResult.Errors
     */
    private async _performWithConcurrencyRetry(label: string, fn: () => Promise<any>): Promise<any> {
        const attemptFn = async () => {
            const result = await fn();
            const { errors } = this._analyzeOperationResult(result) || {};
            if (this._isConcurrencyConflict(errors)) {
                this.logger.warn(`${label}: concurrency conflict detected, will retry`);
                throw new Error('Retryable: Concurrency conflict');
            }
            return result;
        };

        return pRetry(attemptFn, {
            retries: this._concurrencyRetries,
            factor: 2,
            minTimeout: this.retryDelayMs,
            maxTimeout: this.retryDelayMs * 5,
            onFailedAttempt: (error: any) => {
                this.logger.warn(`Logical retry ${label} (attempt ${error.attemptNumber}/${this._concurrencyRetries + 1}): ${error.message}`);
            }
        });
    }

    /**
     * Extract only the name=value pair from a full Set-Cookie string
     */
    private _getCookiePair(setCookieStr: string | null): string {
        try {
            const firstSemi = String(setCookieStr).indexOf(';');
            return firstSemi === -1 ? String(setCookieStr) : String(setCookieStr).slice(0, firstSemi);
        } catch {
            return String(setCookieStr || '');
        }
    }

    /**
     * Validate constructor options
     */
    private _validateOptions(options: IRallyClientConfig): void {
        const { apiKey, authMode, relationshipLoaderOptions } = options;

        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('RallyClient: apiKey is required and must be a string');
        }

        if (authMode && !['bearer', 'zsessionid'].includes(authMode)) {
            throw new Error('RallyClient: authMode must be either "bearer" or "zsessionid"');
        }

        if (relationshipLoaderOptions?.maxDepth !== undefined) {
            this._normalizeIntegerOption(relationshipLoaderOptions.maxDepth, 'relationshipLoaderOptions.maxDepth', 0);
        }

        if (relationshipLoaderOptions?.maxCacheEntries !== undefined) {
            this._normalizeIntegerOption(relationshipLoaderOptions.maxCacheEntries, 'relationshipLoaderOptions.maxCacheEntries', 1);
        }

        if (relationshipLoaderOptions?.inverseQueryChunkSize !== undefined) {
            this._normalizeIntegerOption(relationshipLoaderOptions.inverseQueryChunkSize, 'relationshipLoaderOptions.inverseQueryChunkSize', 1);
        }
    }

    /**
     * Build configuration values from options (returns object for readonly assignment in constructor)
     */
    private _buildConfiguration(options: IRallyClientConfig): {
        apiKey: string; workspace?: string; baseUrl: string; timeoutMs: number;
        retries: number; retryDelayMs: number; authMode: 'bearer' | 'zsessionid';
        debug: boolean; fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    } {
        const {
            apiKey,
            workspace,
            baseUrl = 'https://rally1.rallydev.com/slm/webservice/v2.0',
            timeoutMs = 30000,
            retries = 2,
            retryDelayMs = 500,
            authMode = 'bearer',
            debug = false,
            fetch: customFetch
        } = options;

        return {
            apiKey,
            workspace: workspace || undefined,
            baseUrl: baseUrl.replace(/\/$/, ''),
            timeoutMs: Math.max(1000, timeoutMs),
            retries: Math.max(0, retries),
            retryDelayMs: Math.max(100, retryDelayMs),
            authMode,
            debug: Boolean(debug),
            fetch: customFetch || ((global as any).fetch ? (global as any).fetch.bind(global) : undefined)
        };
    }

    /**
     * Resolve log level based on options and environment
     */
    private _resolveLogLevel(options: IRallyClientConfig): string {
        const { logLevel, debug } = options;
        const validLevels = ['silent', 'error', 'warn', 'info', 'debug'];
        const envLevel = process.env.RALLY_LOG_LEVEL && String(process.env.RALLY_LOG_LEVEL).toLowerCase();
        const isMocha = Array.isArray(process?.argv) && process.argv.some(a => /mocha(\.exe)?$/i.test(a) || a.includes('mocha'));

        if (logLevel && validLevels.includes(String(logLevel).toLowerCase())) {
            return String(logLevel).toLowerCase();
        }

        if (envLevel && validLevels.includes(envLevel)) {
            return envLevel;
        }

        if ((process.env.NODE_ENV === 'test') || isMocha) {
            return 'silent';
        }

        return debug ? 'debug' : 'warn';
    }

    /**
     * Build logger instance from resolved log level
     */
    private _buildLogger(logLevel: string): IRallyLogger {
        const levelRank: Record<string, number> = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
        const rank = levelRank[logLevel] ?? 2;
        return {
            debug: (...args) => rank >= 4 && console.log('[RallyORM:DEBUG]', ...args),
            info: (...args) => rank >= 3 && console.info('[RallyORM:INFO]', ...args),
            warn: (...args) => rank >= 2 && console.warn('[RallyORM:WARN]', ...args),
            error: (...args) => rank >= 1 && console.error('[RallyORM:ERROR]', ...args)
        };
    }

    /**
        * Calculate write permissions from options and environment variables.
     */
    private _buildPermissions(
        options: IRallyClientConfig,
        logger: IRallyLogger
    ): { readOnly: boolean; allowCreate: boolean; allowUpdate: boolean; allowDelete: boolean } {
        const { allowCreate = false, allowUpdate = false, allowDelete = false, readOnly = null } = options;

        const envReadOnly = process.env.RALLY_READ_ONLY;
        const envAllowWrite = process.env.RALLY_ALLOW_WRITE;
        const envAllowCreate = process.env.RALLY_ALLOW_CREATE;
        const envAllowUpdate = process.env.RALLY_ALLOW_UPDATE;
        const envAllowDelete = process.env.RALLY_ALLOW_DELETE;

        let resolvedReadOnly: boolean;
        if (readOnly !== null) {
            resolvedReadOnly = Boolean(readOnly);
        } else if (envReadOnly) {
            resolvedReadOnly = envReadOnly.toLowerCase() === 'true' || envReadOnly === '1';
        } else {
            resolvedReadOnly = false;
        }

        if (resolvedReadOnly) {
            logger.info('RallyClient initialized in READ-ONLY mode');
            return { readOnly: true, allowCreate: false, allowUpdate: false, allowDelete: false };
        }

        const globalWriteEnabled = envAllowWrite &&
            (envAllowWrite.toLowerCase() === 'true' || envAllowWrite === '1');

        const resolvedCreate = Boolean(
            globalWriteEnabled || allowCreate ||
            (envAllowCreate && (envAllowCreate.toLowerCase() === 'true' || envAllowCreate === '1'))
        );
        const resolvedUpdate = Boolean(
            globalWriteEnabled || allowUpdate ||
            (envAllowUpdate && (envAllowUpdate.toLowerCase() === 'true' || envAllowUpdate === '1'))
        );
        const resolvedDelete = Boolean(
            globalWriteEnabled || allowDelete ||
            (envAllowDelete && (envAllowDelete.toLowerCase() === 'true' || envAllowDelete === '1'))
        );

        const enabledOps = [
            resolvedCreate && 'CREATE',
            resolvedUpdate && 'UPDATE',
            resolvedDelete && 'DELETE'
        ].filter(Boolean) as string[];

        if (enabledOps.length > 0) {
            logger.warn(`RallyClient write operations enabled: ${enabledOps.join(', ')}`);
        } else {
            logger.info('RallyClient initialized in read-only mode (no write permissions)');
        }

        return { readOnly: false, allowCreate: resolvedCreate, allowUpdate: resolvedUpdate, allowDelete: resolvedDelete };
    }

    /**
     * Build PQueue options from config
     */
    private _buildQueueOptions(options: IRallyClientConfig): IQueueOptions {
        const { queueOptions = {} } = options;
        const envConcurrency = process.env.RALLY_MAX_CONCURRENT_REQUESTS;
        const resolvedConcurrency = queueOptions.concurrency ?? (
            envConcurrency === undefined
                ? 10
                : this._normalizeIntegerOption(envConcurrency, 'RALLY_MAX_CONCURRENT_REQUESTS', 1)
        );

        return {
            concurrency: resolvedConcurrency,
            interval: 1000,
            intervalCap: 100,
            ...queueOptions
        };
    }

    /**
     * Normalize integer options used in paging-oriented methods.
     */
    private _normalizeIntegerOption(value: unknown, optionName: string, minimum: number): number {
        const numericValue = Number(value);

        if (!Number.isInteger(numericValue) || numericValue < minimum) {
            throw new Error(`RallyClient: ${optionName} must be an integer >= ${minimum}`);
        }

        return numericValue;
    }

    /**
     * Load package version for User-Agent header
     */
    private _loadPackageVersion(): string {
        if (cachedPackageVersion) {
            return cachedPackageVersion;
        }

        for (const pkgPath of PACKAGE_VERSION_CANDIDATE_PATHS) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
                if (pkg && typeof pkg.version === 'string') {
                    cachedPackageVersion = pkg.version;
                    return pkg.version;
                }
            } catch (error: any) {
                this.logger?.debug?.(`Could not load package version from ${pkgPath}:`, error.message);
            }
        }

        cachedPackageVersion = '0.0.0';
        return '0.0.0';
    }

    /**
     * Build default HTTP headers (returns object for readonly assignment in constructor)
     */
    private _buildHeaders(options: IRallyClientConfig): Record<string, string> {
        const { apiKey, authMode = 'bearer' } = options;
        const pkgVersion = this._loadPackageVersion();

        return {
            Accept: 'application/json',
            'User-Agent': `RallyORM/${pkgVersion}`,
            ...(authMode === 'bearer'
                ? { Authorization: `Bearer ${apiKey}` }
                : { zsessionid: apiKey }
            )
        };
    }
}

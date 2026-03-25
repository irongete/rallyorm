import PQueue from 'p-queue';
import pRetry, { AbortError } from 'p-retry';
import { readFileSync } from 'fs';
import {
    RallyValidationError,
    RallyPermissionError,
    RallyOperationError,
    RallyNetworkError,
    RallyTimeoutError
} from './errors.js';

/**
 * Event payload emitted for tracking the progress of long-running operations.
 */
export interface IRallyProgressEvent {
    operation: 'query' | 'relationship' | 'collection';
    entityType?: string;
    relationshipName?: string;
    level?: number;
    current: number;
    total: number;
}

export {
    RallyError,
    RallyValidationError,
    RallyPermissionError,
    RallyOperationError,
    RallyNetworkError,
    RallyTimeoutError
} from './errors.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { toAbsoluteRef, toRelativeRef } from './ref-utils.js';
import { TelemetryReporter } from './telemetry-reporter.js';

/**
 * Queue configuration forwarded to the internal request scheduler.
 *
 * Use these options to control concurrency and timeout behaviour for all Rally
 * requests issued by a client instance.
 */
export interface IQueueOptions {
    concurrency?: number;
    timeout?: number;
    throwOnTimeout?: boolean;
    autoStart?: boolean;
}

/**
 * Options that tune eager and inverse relationship loading.
 */
export interface IRelationshipLoaderOptions {
    maxDepth?: number;
    maxCacheEntries?: number;
    inverseQueryChunkSize?: number;
    collectionConcurrency?: number;
}

/**
 * Configuration used to construct a {@link RallyClient}.
 */
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
    concurrencyRetries?: number;
    logger?: IRallyLogger;
    relationshipLoaderOptions?: IRelationshipLoaderOptions;
    fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    onProgress?: (event: IRallyProgressEvent) => void;
    telemetry?: boolean;
}

/**
 * Query options for standard WSAPI entity queries.
 */
export interface IQueryOptions {
    query?: string;
    fetch?: string | string[];
    start?: number;
    pagesize?: number;
    order?: string;
    maxResults?: number;
    timeoutMs?: number;
}

/**
 * Query options for collection references returned by Rally.
 */
export interface ICollectionQueryOptions {
    fetch?: string | string[];
    start?: number;
    pagesize?: number;
    maxResults?: number;
    timeoutMs?: number;
}

/**
 * Effective write permissions derived from client configuration.
 */
export interface IWritePermissions {
    readOnly: boolean;
    allowCreate: boolean;
    allowUpdate: boolean;
    allowDelete: boolean;
}

/**
 * Logging contract used by {@link RallyClient}.
 */
export interface IRallyLogger {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}

interface IRallyRawResponse {
    QueryResult?: {
        Results?: unknown[];
        TotalResultCount?: number;
        [key: string]: unknown;
    };
    CreateResult?: IRallyRawResponse;
    OperationResult?: IRallyRawResponse;
    DeleteResult?: IRallyRawResponse;
    Object?: IRallyRawResponse;
    ObjectID?: number | string;
    Errors?: string[];
    Warnings?: string[];
    Success?: boolean;
    [key: string]: unknown;
}

interface IFetchMeta {
    op?: string;
    type?: string;
    objectId?: string | number;
    start?: number;
    pagesize?: number;
    ref?: string;
}

interface IRallyOperationResult {
    op: IRallyRawResponse | null;
    errors: string[] | null;
    warnings: string[];
    success?: boolean;
}

const PACKAGE_VERSION_CANDIDATE_PATHS = (() => {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        return [
            join(__dirname, '..', '..', 'package.json'),
            join(__dirname, '..', '..', '..', 'package.json')
        ];
    } catch {
        return [] as string[];
    }
})();

let cachedPackageVersion: string | null = null;

/**
 * Low-level Rally WSAPI client used by repositories and datasources.
 *
 * The client centralizes authentication, retries, request queueing, timeout
 * handling, and write-permission enforcement. Most consumers interact with it
 * indirectly through {@link RallyDataSource} or {@link RallyRepository}, but it
 * can also be used directly for advanced query and collection operations.
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
    private queue!: PQueue;
    private _logger!: IRallyLogger;
    private _usesBuiltInLogger!: boolean;
    private _fetch!: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    private readonly defaultHeaders: Record<string, string>;
    private _jsessionCookie: string | null;
    private _concurrencyRetries: number;
    private readonly _clientOptions: IRallyClientConfig;
    private _telemetryReporter?: TelemetryReporter;

    /**
     * Emit a progress event if a handler is configured.
     * @internal
     */
    emitProgress(event: IRallyProgressEvent): void {
        this._telemetryReporter?.handleProgress(event);

        if (typeof this._clientOptions.onProgress === 'function') {
            this._clientOptions.onProgress(event);
        }
    }

    /**
     * Create a new Rally client instance.
     *
     * @param options Client configuration including authentication, workspace
     * context, retry policy, logging, and write permissions.
     * @throws RallyValidationError When required configuration is missing or invalid.
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
        this._fetch = cfg.fetch;
        this._jsessionCookie = null;
        const rawConcurrencyRetries = options.concurrencyRetries !== undefined
            ? options.concurrencyRetries
            : cfg.retries;
        this._concurrencyRetries = Math.max(0, rawConcurrencyRetries);

        this.logLevel = this._resolveLogLevel(options);
        if (options.logger) {
            this.logger = options.logger;
        } else {
            this._setBuiltInLogger(this._buildLogger(this.logLevel));
        }

        const perms = this._buildPermissions(options, this.logger);
        this.readOnly = perms.readOnly;
        this.allowCreate = perms.allowCreate;
        this.allowUpdate = perms.allowUpdate;
        this.allowDelete = perms.allowDelete;

        this.queue = new PQueue(this._buildQueueOptions(options));

        this.defaultHeaders = this._buildHeaders(options);

        if (options.telemetry) {
            this._telemetryReporter = new TelemetryReporter();
            if (options.logger) {
                // Custom logger bypasses console.* interception — wrap it so its
                // output is still routed through MultiBar.log() when bars are active.
                const reporter = this._telemetryReporter;
                const orig = this._logger;
                this._logger = {
                    debug: (...a) => { reporter.log(...a); orig.debug(...a); },
                    info:  (...a) => { reporter.log(...a); orig.info(...a); },
                    warn:  (...a) => { reporter.log(...a); orig.warn(...a); },
                    error: (...a) => { reporter.log(...a); orig.error(...a); },
                };
            }
        }
    }

    /**
     * Check if a write operation is allowed
     */
    private _checkWritePermission(operation: 'create' | 'update' | 'delete', entityType: string = '') {
        const contextMsg = entityType ? ` for ${entityType}` : '';

        if (this.readOnly) {
            throw new RallyPermissionError(
                `RallyClient: ${operation.toUpperCase()} operation${contextMsg} not allowed - client is in read-only mode. ` +
                'To enable write operations, set readOnly: false and enable specific operations, or use environment variables.'
            );
        }

        switch (operation) {
            case 'create':
                if (!this.allowCreate) {
                    throw new RallyPermissionError(
                        `RallyClient: CREATE operation${contextMsg} not allowed. ` +
                        'Enable with allowCreate: true option or set RALLY_ALLOW_CREATE=true environment variable.'
                    );
                }
                break;
            case 'update':
                if (!this.allowUpdate) {
                    throw new RallyPermissionError(
                        `RallyClient: UPDATE operation${contextMsg} not allowed. ` +
                        'Enable with allowUpdate: true option or set RALLY_ALLOW_UPDATE=true environment variable.'
                    );
                }
                break;
            case 'delete':
                if (!this.allowDelete) {
                    throw new RallyPermissionError(
                        `RallyClient: DELETE operation${contextMsg} not allowed. ` +
                        'Enable with allowDelete: true option or set RALLY_ALLOW_DELETE=true environment variable.'
                    );
                }
                break;
            default:
                throw new RallyValidationError(`RallyClient: Unknown operation type: ${operation}`);
        }
    }

    /**
     * Return the effective write permissions for this client.
     *
     * @returns A normalized permission snapshot derived from `readOnly` and the
     * individual create, update, and delete flags.
     */
    getWritePermissions(): IWritePermissions {
        return {
            readOnly: this.readOnly,
            allowCreate: this.allowCreate,
            allowUpdate: this.allowUpdate,
            allowDelete: this.allowDelete
        };
    }

    /**
     * Return the relationship loader options configured for this client.
     *
     * @returns A shallow copy of the current relationship-loader settings.
     */
    getRelationshipLoaderOptions(): IRelationshipLoaderOptions {
        return {
            ...(this._clientOptions.relationshipLoaderOptions || {})
        };
    }

    /** Public getter for the active logger. */
    get logger(): IRallyLogger {
        return this._logger;
    }

    /**
     * Replaces the active logger. Throws `RallyValidationError` if the provided value
     * does not implement the `IRallyLogger` interface.
     */
    set logger(value: IRallyLogger) {
        if (!value || typeof value.debug !== 'function' || typeof value.info !== 'function' || typeof value.warn !== 'function' || typeof value.error !== 'function') {
            throw new RallyValidationError('RallyClient: logger must implement IRallyLogger (debug, info, warn, error methods)');
        }
        this._logger = value;
        this._usesBuiltInLogger = false;
    }

    /** Public getter for the active fetch function. */
    get fetch(): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
        return this._fetch;
    }

    /**
     * Replaces the active fetch function. Throws `RallyValidationError` if the provided
     * value is not a function.
     */
    set fetch(value: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
        if (typeof value !== 'function') {
            throw new RallyValidationError('RallyClient: fetch must be a function');
        }
        this._fetch = value;
    }

    /**
     * Replace the active logger at runtime.
     *
     * @param logger Logger implementation that satisfies {@link IRallyLogger}.
     * @throws RallyValidationError When `logger` does not implement the required methods.
     */
    setLogger(logger: IRallyLogger): void {
        this.logger = logger;
    }

    /**
     * Replace the active fetch implementation at runtime.
     *
     * @param fetchFn Fetch-compatible function used for all subsequent HTTP requests.
     * @throws RallyValidationError When `fetchFn` is not a function.
     */
    setFetch(fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>): void {
        this.fetch = fetchFn;
    }

    /**
     * Change the built-in logger level at runtime.
     *
     * @param level New minimum log level for the built-in logger.
     * @remarks This only affects the built-in logger. Custom loggers supplied via
     * `options.logger` keep full control over their own filtering.
     */
    setLogLevel(level: 'silent' | 'error' | 'warn' | 'info' | 'debug'): void {
        this.logLevel = level;
        if (this._usesBuiltInLogger) {
            this._setBuiltInLogger(this._buildLogger(level));
        }
    }

    private _setBuiltInLogger(logger: IRallyLogger): void {
        this._logger = logger;
        this._usesBuiltInLogger = true;
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
    private _params(extra: Record<string, unknown> = {}): Record<string, unknown> {
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
    private async _requestWithRetry(taskFn: () => Promise<IRallyRawResponse>, meta: IFetchMeta = {}): Promise<IRallyRawResponse> {
        const result = await this.queue.add<IRallyRawResponse>(() =>
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

        if (result === undefined) {
            throw new RallyTimeoutError(`Queue timeout while executing ${meta.op || 'request'}`);
        }

        return result;
    }

    /**
     * Perform HTTP request with JSON handling
     */
    private async _fetchJson(url: string, { method = 'GET', headers = {}, params, body, meta = {} }: { method?: string; headers?: Record<string, string>; params?: Record<string, unknown>; body?: unknown; meta?: IFetchMeta } = {}): Promise<IRallyRawResponse> {
        const requestUrl = new URL(url);
        const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

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
                        throw new RallyNetworkError(`Retryable: ${errorMessage}`, response.status);
                    }

                    if (response.status === 409) {
                        // HTTP 409 Conflict may indicate a transient concurrency conflict; treat as retryable
                        throw new RallyNetworkError(`Retryable: ${errorMessage}`, response.status);
                    }

                    if (response.status >= 500) {
                        throw new RallyNetworkError(`Retryable: ${errorMessage}`, response.status);
                    }

                    throw new AbortError(new RallyNetworkError(`${errorMessage}: ${responseText.slice(0, 300)}`, response.status));
                }

                this.logger.debug(`[req:${requestId}] ${method} ${this._formatUrlForLog(requestUrl)} [status=${response.status}]`);

                if (!responseText) {
                    return {} as IRallyRawResponse;
                }

                try {
                    return JSON.parse(responseText) as IRallyRawResponse;
                } catch (error: any) {
                    throw new RallyNetworkError(`Retryable: Invalid JSON response - ${error.message}`);
                }

            } catch (error: any) {
                clearTimeout(timeoutId);

                if (error instanceof AbortError) {
                    throw error;
                }

                if (error.name === 'AbortError' || error.message?.includes('timeout')) {
                    throw new RallyTimeoutError(`Request timeout after ${this.timeoutMs}ms`);
                }

                if (error.message?.includes('fetch')) {
                    throw new RallyNetworkError(`Network error - ${error.message}`);
                }

                throw error;
            }
        };

        return this._requestWithRetry(executeRequest, meta);
    }

    /**
     * Query Rally entities using standard WSAPI pagination.
     *
     * @param type Rally entity type such as `defect`, `project`, or `hierarchicalrequirement`.
     * @param options Query text and paging options forwarded to WSAPI.
     * @returns The current page of matching raw Rally records.
     * @throws RallyValidationError When `type`, `start`, or `pagesize` are invalid.
     * @throws RallyNetworkError When the request fails at the HTTP or network layer.
     * @throws RallyTimeoutError When the request exceeds the configured timeout.
     */
    async query<T = unknown>(type: string, { query, fetch, start = 1, pagesize = 200, order }: IQueryOptions = {}): Promise<T[]> {
        if (!type || typeof type !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
        }

        const startIndex = this._normalizeIntegerOption(start, 'start', 1);
        const pageSize = this._normalizeIntegerOption(pagesize, 'pagesize', 1);

        const result = await this._fetchJson(this._url(type), {
            method: 'GET',
            params: { query, fetch, start: startIndex, pagesize: pageSize, order },
            meta: { op: 'query', type, start: startIndex, pagesize: pageSize }
        });

        return (result?.QueryResult?.Results ?? []) as T[];
    }

    /**
     * Return only the total number of entities matching a query.
     *
     * @param type Rally entity type to count.
     * @param options Query options. Only `query` is used for the count request.
     * @returns Total number of matching records reported by Rally.
     * @throws RallyValidationError When `type` is invalid.
     */
    async queryCount(type: string, { query }: IQueryOptions = {}): Promise<number> {
        if (!type || typeof type !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
        }

        const result = await this._fetchJson(this._url(type), {
            method: 'GET',
            params: { query, fetch: 'ObjectID', start: 1, pagesize: 1 },
            meta: { op: 'queryCount', type }
        });

        return result?.QueryResult?.TotalResultCount ?? 0;
    }

    /**
     * Query all matching Rally entities, automatically traversing additional pages.
     *
     * @param type Rally entity type to query.
     * @param options Query, ordering, paging, and optional result-limiting options.
     * @returns Matching records accumulated across all fetched pages.
     * @throws RallyValidationError When `type` or paging inputs are invalid.
     * @throws RallyTimeoutError When the overall operation exceeds `timeoutMs`.
     */
    async queryAll<T = unknown>(type: string, { query, fetch, order, pagesize = 200, maxResults, timeoutMs, start = 1 }: IQueryOptions = {}): Promise<T[]> {
        if (!type || typeof type !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
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
        const firstPageResults: T[] = (queryResult.Results || []) as T[];

        this.logger.debug(`Found ${totalCount} total results, fetched ${firstPageResults.length} in first page`);

        return this._paginateResults<T>(
            firstPageResults,
            typeof totalCount === 'number' ? totalCount : 0,
            startIndex,
            pageSize,
            normalizedMaxResults,
            operationDeadline,
            (nextStart) => this._fetchJson(this._url(type), {
                method: 'GET',
                params: { query, fetch, start: nextStart, pagesize: pageSize, order },
                meta: { op: 'queryAll:page', type, start: nextStart }
            }).then(data => (data?.QueryResult?.Results || []) as T[]),
            'Operation',
            type
        );
    }

    /**
     * Fetch a single Rally entity by ObjectID.
     *
     * @param type Rally entity type to load.
     * @param objectId Rally ObjectID for the requested record.
     * @param options Optional field selection for the read request.
     * @returns The raw Rally entity payload.
     * @throws RallyValidationError When `type` or `objectId` are invalid.
     */
    async get<T = unknown>(type: string, objectId: string | number, { fetch }: Pick<IQueryOptions, 'fetch'> = {}): Promise<T> {
        if (!type || typeof type !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
        }
        if (!objectId) {
            throw new RallyValidationError('ObjectID is required');
        }

        const result = await this._fetchJson(this._url(`${type}/${objectId}`), {
            method: 'GET',
            params: { fetch },
            meta: { op: 'get', type, objectId }
        });

        return this._extractEntityFromResponse(result, type) as T;
    }

    /**
     * Query a collection reference returned by Rally WSAPI.
     *
     * @param collectionRef Absolute or relative Rally collection reference.
     * @param options Field selection and paging options for the collection request.
     * @returns The current page of records from the target collection.
     * @throws RallyValidationError When `collectionRef` or paging inputs are invalid.
     */
    async queryCollection<T = unknown>(collectionRef: string, { fetch, start = 1, pagesize = 200 }: ICollectionQueryOptions = {}): Promise<T[]> {
        if (!collectionRef || typeof collectionRef !== 'string') {
            throw new RallyValidationError('Collection reference is required and must be a string');
        }

        const startIndex = this._normalizeIntegerOption(start, 'start', 1);
        const pageSize = this._normalizeIntegerOption(pagesize, 'pagesize', 1);

        const result = await this._queryCollectionPage(collectionRef, {
            fetch,
            start: startIndex,
            pagesize: pageSize
        });

        return (result?.QueryResult?.Results ?? result?.Results ?? []) as T[];
    }

    /**
     * Query every item from a Rally collection reference.
     *
     * @param collectionRef Absolute or relative Rally collection reference.
     * @param options Field selection, paging, and optional max-result controls.
     * @returns Records accumulated from every fetched page in the collection.
     * @throws RallyValidationError When `collectionRef` or paging inputs are invalid.
     * @throws RallyTimeoutError When the overall operation exceeds `timeoutMs`.
     */
    async queryCollectionAll<T = unknown>(collectionRef: string, { fetch, start = 1, pagesize = 200, maxResults, timeoutMs }: ICollectionQueryOptions = {}): Promise<T[]> {
        if (!collectionRef || typeof collectionRef !== 'string') {
            throw new RallyValidationError('Collection reference is required and must be a string');
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
            return (firstResult?.Results as T[] | undefined ?? []);
        }

        const totalCount = queryResult.TotalResultCount ?? 0;

        return this._paginateResults<T>(
            (queryResult.Results || []) as T[],
            typeof totalCount === 'number' ? totalCount : 0,
            startIndex,
            pageSize,
            normalizedMaxResults,
            operationDeadline,
            (nextStart) => this._queryCollectionPage(collectionRef, {
                fetch,
                start: nextStart,
                pagesize: pageSize
            }).then(data => (data?.QueryResult?.Results ?? data?.Results ?? []) as T[]),
            'Collection query',
            collectionRef.split('/').pop()?.split('?')[0] ?? collectionRef
        );
    }

    /**
     * Shared pagination driver used by queryAll and queryCollectionAll.
     * Fetches remaining pages in parallel batches and returns up to the effective max items.
     */
    private async _paginateResults<T>(
        firstPageResults: T[],
        totalCount: number,
        startIndex: number,
        pageSize: number,
        effectiveMaxResults: number | undefined,
        operationDeadline: number | null,
        fetchPage: (nextStart: number) => Promise<T[]>,
        context: string,
        entityType?: string
    ): Promise<T[]> {
        const remainingFromStart = Math.max(0, totalCount - (startIndex - 1));
        const effective = effectiveMaxResults !== undefined
            ? Math.min(effectiveMaxResults, remainingFromStart)
            : remainingFromStart;

        const results = [...firstPageResults];
        
        this.emitProgress({
            operation: context === 'Collection query' ? 'collection' : 'query',
            entityType,
            current: Math.min(results.length, effective),
            total: effective
        });

        if (results.length >= effective) {
            return results.slice(0, effective);
        }

        const remainingPages: number[] = [];
        for (let nextStart = startIndex + pageSize; (nextStart - (startIndex - 1)) <= effective; nextStart += pageSize) {
            remainingPages.push(nextStart);
        }

        const batchSize = Math.max(1, (this.queue.concurrency || 10) * 2);

        for (let i = 0; i < remainingPages.length; i += batchSize) {
            if (operationDeadline && Date.now() > operationDeadline) {
                this.logger.warn(`${context} timeout reached, returning ${results.length} results`);
                break;
            }

            const batch = remainingPages.slice(i, i + batchSize);

            // Emit progress as each individual page resolves rather than waiting
            // for the whole batch. This gives the progress bar a smooth update
            // per request instead of a single jump after all concurrency slots drain.
            await Promise.all(batch.map(async (nextStart) => {
                const page = await fetchPage(nextStart);
                results.push(...page);
                this.emitProgress({
                    operation: context === 'Collection query' ? 'collection' : 'query',
                    entityType,
                    current: Math.min(results.length, effective),
                    total: effective
                });
            }));

            if (results.length >= effective) {
                return results.slice(0, effective);
            }
        }

        return results.slice(0, effective);
    }

    private async _queryCollectionPage(collectionRef: string, { fetch, start, pagesize }: Required<Pick<ICollectionQueryOptions, 'start' | 'pagesize'>> & Pick<ICollectionQueryOptions, 'fetch'>): Promise<IRallyRawResponse> {
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
     * Create a new Rally entity.
     *
     * @param type Rally entity type to create.
     * @param payload Field payload sent to WSAPI.
     * @returns The created Rally entity payload.
     * @throws RallyPermissionError When create operations are disabled.
     * @throws RallyValidationError When `type` or `payload` are invalid.
     * @throws RallyOperationError When Rally rejects the operation.
     */
    async create<T = unknown>(type: string, payload: any): Promise<T> {
        this._checkWritePermission('create', type);

        if (!type || typeof type !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
        }
        if (!payload || typeof payload !== 'object') {
            throw new RallyValidationError('Payload is required and must be an object');
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

        return createdEntity as T;
    }

    /**
     * Update an existing Rally entity.
     *
     * @param type Rally entity type to update.
     * @param objectId Rally ObjectID for the target record.
     * @param payload Partial field payload to persist.
     * @returns The updated Rally entity payload.
     * @throws RallyPermissionError When update operations are disabled.
     * @throws RallyValidationError When required inputs are missing or invalid.
     * @throws RallyOperationError When Rally rejects the operation.
     */
    async update<T = unknown>(type: string, objectId: string | number, payload: any): Promise<T> {
        this._checkWritePermission('update', type);

        if (!type || typeof type !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
        }
        if (!objectId) {
            throw new RallyValidationError('ObjectID is required');
        }
        if (!payload || typeof payload !== 'object') {
            throw new RallyValidationError('Payload is required and must be an object');
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

        return updatedEntity as T;
    }

    /**
     * Delete a Rally entity by ObjectID.
     *
     * @param type Rally entity type to delete.
     * @param objectId Rally ObjectID for the record to remove.
     * @returns `true` when Rally confirms the delete operation.
     * @throws RallyPermissionError When delete operations are disabled.
     * @throws RallyValidationError When required inputs are missing or invalid.
     * @throws RallyOperationError When Rally rejects the operation.
     */
    async delete(type: string, objectId: string | number): Promise<boolean> {
        this._checkWritePermission('delete', type);

        if (!type || typeof type !== 'string') {
            throw new RallyValidationError('Entity type is required and must be a string');
        }
        if (!objectId) {
            throw new RallyValidationError('ObjectID is required');
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
    private _analyzeOperationResult(result: IRallyRawResponse): IRallyOperationResult {
        const op = result.OperationResult ?? result.CreateResult ?? result.DeleteResult ?? null;
        const opErrors = op?.Errors;
        const opWarnings = op?.Warnings;
        const errors: string[] | null = Array.isArray(opErrors) ? opErrors
            : (Array.isArray(result.Errors) ? result.Errors : null);
        const warnings: string[] = Array.isArray(opWarnings) ? opWarnings
            : (Array.isArray(result.Warnings) ? result.Warnings : []);
        return { op: op ?? null, errors, warnings };
    }

    private _hasStructuredEntityPayload(result: IRallyRawResponse, type: string): boolean {
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

    private _resolveOperationSuccess(action: 'create' | 'update' | 'delete', type: string, result: IRallyRawResponse, op: IRallyRawResponse | null, errors: string[] | null): boolean {
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
    private _logAndHandleOperation(action: 'create' | 'update' | 'delete', type: string, objectId: string | number | undefined, result: IRallyRawResponse, { throwOnErrors = false } = {}): IRallyOperationResult {
        const { op, errors, warnings } = this._analyzeOperationResult(result);
        const success = this._resolveOperationSuccess(action, type, result, op, errors);

        this.logger.debug(`[${action}:${type}] opResult: errors=${Array.isArray(errors) ? errors.length : 'n/a'} warnings=${warnings.length} success=${success}`);

        const actionLabel = `${action.charAt(0).toUpperCase() + action.slice(1)} ${type}${objectId ? ` ${objectId}` : ''}`;
        if (Array.isArray(errors) && errors.length > 0) {
            this.logger.error(`${actionLabel} returned errors:`, errors);
            if (throwOnErrors) {
                throw new RallyOperationError(
                    `Rally ${action} failed for ${type}${objectId ? ` ${objectId}` : ''}: ${errors.join(' | ')}`,
                    errors,
                    warnings
                );
            }
        } else if (!success) {
            const message = `Rally ${action} failed for ${type}${objectId ? ` ${objectId}` : ''}: response did not confirm success`;
            this.logger.error(message, result);
            if (throwOnErrors) {
                throw new RallyOperationError(message, [], warnings);
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
    private _extractEntityFromResponse(response: IRallyRawResponse, type: string): IRallyRawResponse {
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
            return response[entityKey] as IRallyRawResponse;
        }

        const normalizedEntityKey = entityKey.toLowerCase();
        const lastEntitySegment = normalizedEntityKey.split('/').pop() || normalizedEntityKey;

        for (const [responseKey, value] of Object.entries(response)) {
            const normalizedResponseKey = String(responseKey).toLowerCase();

            if (normalizedResponseKey === normalizedEntityKey || normalizedResponseKey === lastEntitySegment) {
                return value as IRallyRawResponse;
            }
        }

        return response;
    }

    /**
     * Determine if OperationResult errors indicate a concurrency conflict
     */
    private _isConcurrencyConflict(errors: string[] | null): boolean {
        if (!Array.isArray(errors)) {
            return false;
        }
        const pattern = /(Concurrency\s*conflict|ConcurrencyConflictException|Modified since read|has been modified since being read)/i;
        return errors.some(e => pattern.test(String(e)));
    }

    /**
     * Run a write operation and retry when Rally reports a concurrency conflict in OperationResult.Errors
     */
    private async _performWithConcurrencyRetry(label: string, fn: () => Promise<IRallyRawResponse>): Promise<IRallyRawResponse> {
        const attemptFn = async () => {
            const result = await fn();
            const { errors } = this._analyzeOperationResult(result);
            if (this._isConcurrencyConflict(errors)) {
                this.logger.warn(`${label}: concurrency conflict detected, will retry`);
                throw new RallyOperationError('Retryable: Concurrency conflict', errors || []);
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
            throw new RallyValidationError('RallyClient: apiKey is required and must be a string');
        }

        if (authMode && !['bearer', 'zsessionid'].includes(authMode)) {
            throw new RallyValidationError('RallyClient: authMode must be either "bearer" or "zsessionid"');
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

        const resolvedFetch = customFetch ?? globalThis.fetch?.bind(globalThis);
        if (typeof resolvedFetch !== 'function') {
            throw new RallyValidationError('RallyClient: fetch is not available in this runtime. Provide a fetch implementation in IRallyClientConfig.fetch or use Node.js >= 18 with fetch enabled');
        }

        return {
            apiKey,
            workspace: workspace || undefined,
            baseUrl: baseUrl.replace(/\/$/, ''),
            timeoutMs: Math.max(1000, timeoutMs),
            retries: Math.max(0, retries),
            retryDelayMs: Math.max(100, retryDelayMs),
            authMode,
            debug: Boolean(debug),
            fetch: resolvedFetch
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
    private _buildQueueOptions(options: IRallyClientConfig): ConstructorParameters<typeof PQueue>[0] {
        const { queueOptions = {} } = options;
        const envConcurrency = process.env.RALLY_MAX_CONCURRENT_REQUESTS;
        const resolvedConcurrency = queueOptions.concurrency ?? (
            envConcurrency === undefined
                ? 10
                : this._normalizeIntegerOption(envConcurrency, 'RALLY_MAX_CONCURRENT_REQUESTS', 1)
        );

        // Only pass options supported by p-queue v8+.
        return {
            concurrency: resolvedConcurrency,
            ...(queueOptions.timeout !== undefined ? { timeout: queueOptions.timeout } : {}),
            ...(queueOptions.throwOnTimeout !== undefined ? { throwOnTimeout: queueOptions.throwOnTimeout } : {}),
            ...(queueOptions.autoStart !== undefined ? { autoStart: queueOptions.autoStart } : {})
        };
    }

    /**
     * Normalize integer options used in paging-oriented methods.
     */
    private _normalizeIntegerOption(value: unknown, optionName: string, minimum: number): number {
        const numericValue = Number(value);

        if (!Number.isInteger(numericValue) || numericValue < minimum) {
            throw new RallyValidationError(`RallyClient: ${optionName} must be an integer >= ${minimum}`);
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

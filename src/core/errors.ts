/**
 * Typed error hierarchy for RallyORM.
 *
 * All errors extend {@link RallyError}, giving consumers a single base to catch
 * plus granular subclasses for targeted handling:
 *
 * ```ts
 * import { RallyError, RallyPermissionError, RallyOperationError } from 'rallyorm';
 *
 * try {
 *   await repo.create(data);
 * } catch (e) {
 *   if (e instanceof RallyPermissionError) { /* write not enabled *\/ }
 *   if (e instanceof RallyOperationError)  { console.log(e.rallyErrors); }
 *   if (e instanceof RallyError)           { console.log(e.code); }
 * }
 * ```
 */

/**
 * Base error for all RallyORM-specific errors.
 * @property code - Machine-readable identifier (e.g. `'OPERATION_ERROR'`, `'PERMISSION_DENIED'`).
 */
export class RallyError extends Error {
    readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'RallyError';
        this.code = code;
        // Maintain correct prototype chain in transpiled ES5 environments.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when an input argument fails validation (e.g. missing required field, invalid type,
 * out-of-range paging option, unsupported query operator).
 */
export class RallyValidationError extends RallyError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'RallyValidationError';
    }
}

/**
 * Thrown when a write operation (`create`, `update`, `delete`) is not permitted by the
 * current client configuration (`readOnly`, `allowCreate`, `allowUpdate`, `allowDelete`).
 */
export class RallyPermissionError extends RallyError {
    constructor(message: string) {
        super(message, 'PERMISSION_DENIED');
        this.name = 'RallyPermissionError';
    }
}

/**
 * Thrown when the Rally WSAPI returns `OperationResult.Errors`, or the response does not
 * confirm a successful operation after all retries are exhausted.
 *
 * @property rallyErrors   - Raw error strings returned by Rally.
 * @property rallyWarnings - Warning strings returned alongside the errors (may be empty).
 */
export class RallyOperationError extends RallyError {
    readonly rallyErrors: string[];
    readonly rallyWarnings: string[];

    constructor(message: string, rallyErrors: string[] = [], rallyWarnings: string[] = []) {
        super(message, 'OPERATION_ERROR');
        this.name = 'RallyOperationError';
        this.rallyErrors = rallyErrors;
        this.rallyWarnings = rallyWarnings;
    }
}

/**
 * Thrown when a network-level error occurs (HTTP 4xx/5xx, connection refused, DNS failure).
 *
 * @property statusCode - HTTP status code when the error originated from an HTTP response.
 */
export class RallyNetworkError extends RallyError {
    readonly statusCode?: number;

    constructor(message: string, statusCode?: number) {
        super(message, 'NETWORK_ERROR');
        this.name = 'RallyNetworkError';
        this.statusCode = statusCode;
    }
}

/**
 * Thrown when a request exceeds the configured `timeoutMs` and is aborted.
 */
export class RallyTimeoutError extends RallyError {
    constructor(message: string) {
        super(message, 'TIMEOUT');
        this.name = 'RallyTimeoutError';
    }
}

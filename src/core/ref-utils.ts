/**
 * Shared utilities for handling Rally API references
 * Extracted to avoid code duplication across repository and relationship loader
 */

/**
 * Remove the "/slm/webservice/{version}" prefix from a path-like string.
 */
export function stripWsapiPrefix(path: string | null | undefined): string | null | undefined {
    if (!path || typeof path !== 'string') { return path; }
    const idx = path.indexOf('/slm/webservice/');
    if (idx >= 0) {
        const after = path.slice(idx + '/slm/webservice/'.length);
        const slash = after.indexOf('/');
        if (slash >= 0) {
            return after.slice(slash).replace(/\/\/+/, '/');
        }
    }
    return path;
}

/**
 * Convert an absolute WSAPI _ref to a relative path
 * e.g., https://host/slm/webservice/v2.0/hierarchicalrequirement/123 -> /hierarchicalrequirement/123
 * Leaves already-relative refs unchanged; falls back to original on parse issues.
 */
export function toRelativeRef(ref: string | null | undefined, baseUrl: string = ''): string | null | undefined {
    if (!ref || typeof ref !== 'string') { return ref; }
    if (ref.startsWith('/')) { return ref; }

    try {
        const url = new URL(ref);
        const relative = stripWsapiPrefix(url.pathname);
        if (relative && relative.startsWith('/')) { return relative; }
    } catch {}

    if (baseUrl && ref.startsWith(baseUrl)) {
        const tail = ref.slice(baseUrl.length);
        return tail.startsWith('/') ? tail : `/${tail}`;
    }

    const stripped = stripWsapiPrefix(ref);
    return stripped && stripped.startsWith('/') ? stripped : ref;
}

/**
 * Normalize a Rally entity type or ref-type name for comparisons and registry lookup.
 * Preserves slash-delimited hierarchy segments such as portfolioitem/feature.
 */
export function normalizeEntityType(type: string | null | undefined): string | null {
    if (!type || typeof type !== 'string') { return null; }

    const normalized = type.trim().replace(/^\/+/, '').toLowerCase();
    return normalized || null;
}

/**
 * Check whether a string is a Rally reference path or URL.
 */
export function isRallyRef(ref: string | null | undefined): boolean {
    if (!ref || typeof ref !== 'string') { return false; }

    const relative = toRelativeRef(ref);
    return typeof relative === 'string'
        && /^\/[a-z0-9]+(?:\/[a-z0-9]+)*\/\d+$/i.test(relative);
}

/**
 * Convert a relative ref to an absolute ref using the provided base URL.
 */
export function toAbsoluteRef(rel: string | null | undefined, baseUrl: string): string | null | undefined {
    if (!rel || typeof rel !== 'string') { return rel; }
    if (!rel.startsWith('/')) { return rel; }
    if (!baseUrl) { return rel; }
    return `${baseUrl}${rel}`;
}

/**
 * Extract the ObjectID from a Rally reference.
 */
export function extractObjectIdFromRef(ref: string | null | undefined): string | null {
    const r = toRelativeRef(ref);
    if (!r) return null;
    const match = r.match(/\/(\d+)$/);
    return match ? match[1] : null;
}

/**
 * Extract the entity type from a Rally reference.
 */
export function getEntityTypeFromRef(ref: string | null | undefined): string | null {
    const r = toRelativeRef(ref);
    if (!r) return null;
    const match = r.match(/^\/([a-zA-Z0-9]+(?:\/[a-zA-Z0-9]+)*)\/\d+$/);
    return match ? normalizeEntityType(match[1]) : null;
}

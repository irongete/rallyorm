/**
 * Shared helpers for building Rally WSAPI query strings.
 */

/**
 * Combine already-parenthesized conditions with `AND` / `OR` the way Rally parses them.
 *
 * Rally's query grammar is strictly binary: `((A) OR (B))` is valid, but
 * `((A) OR (B) OR (C))` and the redundant `((A))` are parse errors. Rally reports those
 * as an HTTP 200 with `QueryResult.Errors`, so a flat join silently returns nothing.
 * This folds left-to-right into `(((A) OR (B)) OR (C))`.
 *
 * @param conditions Conditions that are each already wrapped in parentheses.
 * @param operator Boolean operator used between conditions.
 * @returns The combined condition, the single condition unchanged, or `''` when empty.
 */
export function joinConditions(conditions: readonly string[], operator: 'AND' | 'OR'): string {
    const parts = conditions.filter(Boolean);
    if (parts.length === 0) { return ''; }
    return parts.reduce((combined, condition) => `(${combined} ${operator} ${condition})`);
}

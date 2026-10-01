/**
 * Strict model of Rally WSAPI's query grammar, used to assert that generated queries
 * would actually parse server-side. Verified live against Rally:
 *
 * - `(Field op value)` is a leaf.
 * - `(<expr> AND|OR <expr>)` combines exactly two expressions.
 * - Flat chains `((A) OR (B) OR (C))` and redundant wrapping `((A))` are rejected.
 *
 * Returns `null` when the query parses, or a short reason when it does not.
 */
export function rallyQueryParseError(query: string): string | null {
    let pos = 0;

    const fail = (reason: string): never => {
        throw new Error(`${reason} at ${pos}: ${query.slice(Math.max(0, pos - 20), pos)}⟨${query.slice(pos, pos + 20)}⟩`);
    };

    const expect = (token: string) => {
        if (!query.startsWith(token, pos)) { fail(`expected "${token}"`); }
        pos += token.length;
    };

    const parseExpression = (): void => {
        expect('(');
        if (query[pos] === '(') {
            parseExpression();
            if (query.startsWith(' AND ', pos)) {
                pos += 5;
            } else if (query.startsWith(' OR ', pos)) {
                pos += 4;
            } else {
                fail('expected AND/OR');
            }
            parseExpression();
            expect(')');
            return;
        }

        // Leaf: everything up to the closing parenthesis, honouring quoted values.
        const start = pos;
        while (pos < query.length && query[pos] !== ')') {
            if (query[pos] === '"') {
                pos++;
                while (pos < query.length && query[pos] !== '"') {
                    pos += query[pos] === '\\' ? 2 : 1;
                }
                if (pos >= query.length) { fail('unterminated string'); }
            }
            pos++;
        }
        if (!/^\S+ (=|!=|>|>=|<|<=|contains|!contains) \S/.test(query.slice(start, pos))) {
            fail('malformed condition');
        }
        expect(')');
    };

    try {
        parseExpression();
        if (pos !== query.length) { fail('trailing input'); }
        return null;
    } catch (error) {
        return (error as Error).message;
    }
}

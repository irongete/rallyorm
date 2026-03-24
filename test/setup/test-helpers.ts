/**
 * Test helpers for RallyORM unit tests
 */

/**
 * Creates a mock RallyClient for testing
 */
export function createMockClient(overrides: any = {}): any {
    return {
        query: async () => [],
        queryCollection: async () => [],
        queryAll: async () => [],
        queryCount: async () => 0,
        get: async () => null,
        create: async (type: string, data: any) => ({ ObjectID: '12345', ...data }),
        update: async (type: string, id: string, data: any) => ({ ObjectID: id, ...data }),
        delete: async () => true,
        baseUrl: 'https://rally1.rallydev.com/slm/webservice/v2.0',
        logger: {
            debug: () => { },
            info: () => { },
            warn: () => { },
            error: () => { }
        },
        ...overrides
    };
}

/**
 * Creates a mock Rally API response
 */
export function createMockResponse(data: any, type: string = 'query'): any {
    switch (type) {
        case 'query':
            return {
                QueryResult: {
                    Results: Array.isArray(data) ? data : [data],
                    TotalResultCount: Array.isArray(data) ? data.length : 1
                }
            };
        case 'create':
            return {
                CreateResult: {
                    Object: data,
                    Errors: [],
                    Warnings: []
                }
            };
        case 'update':
            return {
                OperationResult: {
                    Object: data,
                    Errors: [],
                    Warnings: []
                }
            };
        case 'delete':
            return {
                OperationResult: {
                    Errors: [],
                    Warnings: []
                }
            };
        case 'error':
            return {
                OperationResult: {
                    Errors: Array.isArray(data) ? data : [data],
                    Warnings: []
                }
            };
        default:
            return data;
    }
}

/**
 * Creates a mock fetch function
 */
export function createMockFetch(responses: Record<string, any> = {}): (url: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
    return async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = String(url);
        for (const [pattern, response] of Object.entries(responses)) {
            if (urlStr.includes(pattern)) {
                return {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: { get: () => null, getSetCookie: () => [] },
                    text: async () => JSON.stringify(response),
                    json: async () => response
                } as unknown as Response;
            }
        }
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: { get: () => null, getSetCookie: () => [] },
            text: async () => '{}',
            json: async () => ({})
        } as unknown as Response;
    };
}

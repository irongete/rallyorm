/**
 * Test fixtures for RallyORM unit tests
 */

export const mockDefect = {
    ObjectID: '12345',
    FormattedID: 'DE123',
    Name: 'Test Defect',
    State: 'Open',
    Priority: 'High',
    _ref: '/defect/12345',
    _type: 'Defect'
};

export const mockUserStory = {
    ObjectID: '67890',
    FormattedID: 'US456',
    Name: 'Test User Story',
    ScheduleState: 'Defined',
    PlanEstimate: 5,
    _ref: '/hierarchicalrequirement/67890',
    _type: 'HierarchicalRequirement'
};

export const mockTask = {
    ObjectID: '11111',
    FormattedID: 'TA789',
    Name: 'Test Task',
    State: 'Defined',
    Estimate: 4,
    ToDo: 4,
    _ref: '/task/11111',
    _type: 'Task'
};

export const mockProject = {
    ObjectID: '22222',
    Name: 'Test Project',
    State: 'Open',
    _ref: '/project/22222',
    _type: 'Project'
};

export const mockUser = {
    ObjectID: '33333',
    UserName: 'testuser',
    DisplayName: 'Test User',
    EmailAddress: 'test@example.com',
    _ref: '/user/33333',
    _type: 'User'
};

export const mockTestCase = {
    ObjectID: '44444',
    FormattedID: 'TC001',
    Name: 'Test Case',
    Method: 'Manual',
    Type: 'Functional',
    _ref: '/testcase/44444',
    _type: 'TestCase'
};

// Response fixtures
export const emptyQueryResponse = {
    QueryResult: {
        Results: [],
        TotalResultCount: 0
    }
};

export const singleDefectQueryResponse = {
    QueryResult: {
        Results: [mockDefect],
        TotalResultCount: 1
    }
};

export const createSuccessResponse = {
    CreateResult: {
        Object: mockDefect,
        Errors: [],
        Warnings: []
    }
};

export const updateSuccessResponse = {
    OperationResult: {
        Object: mockDefect,
        Errors: [],
        Warnings: []
    }
};

export const deleteSuccessResponse = {
    OperationResult: {
        Errors: [],
        Warnings: []
    }
};

export const concurrencyErrorResponse = {
    OperationResult: {
        Errors: ['Concurrency conflict: Object has been modified since being read'],
        Warnings: []
    }
};

export const validationErrorResponse = {
    OperationResult: {
        Errors: ['Name is required'],
        Warnings: []
    }
};

import assert from 'node:assert/strict';

import {
    RallyClient,
    RallyDataSource,
    RallyEntity,
    RallyRepository,
    Theme,
    UserStory,
    WorkspaceConfiguration
} from 'rallyorm';
import {
    createCustomFieldAccessor,
    isValidCustomFieldName
} from 'rallyorm/utils';

assert.equal(typeof RallyClient, 'function');
assert.equal(typeof RallyDataSource, 'function');
assert.equal(UserStory.entityType, 'hierarchicalrequirement');
assert.equal(WorkspaceConfiguration.entityType, 'workspaceconfiguration');
assert.equal(Theme.entityType, 'portfolioitem/theme');
assert.equal(isValidCustomFieldName('c_CustomField'), true);

const dataSource = new RallyDataSource({ apiKey: 'test-key' });
assert.equal(dataSource.userStories.entityType, 'hierarchicalrequirement');
assert.equal(dataSource.getRepository('workspaceconfiguration').modelClass, WorkspaceConfiguration);

const story = new UserStory({ Name: 'Smoke Test Story', c_CustomField: 'Value' });
const customFields = createCustomFieldAccessor(story);

assert.equal(customFields.c_CustomField, 'Value');

class SmokeValidationModel extends RallyEntity {
    static entityType = 'smokevalidation';
    static fields = {
        Settings: { type: 'object' },
        Labels: { type: 'array' }
    };
}

const validationModel = new SmokeValidationModel({
    Settings: { mode: 'strict' },
    Labels: ['consumer']
});

assert.equal(validationModel.validate(), true);

const writeCalls = [];
const repo = new RallyRepository('defect', {
    query: async () => [],
    update: async (type, id, data) => {
        writeCalls.push({ type, id, data });
        return { ObjectID: id, ...data };
    },
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    baseUrl: 'https://rally1.rallydev.com/slm/webservice/v2.0'
}, RallyEntity);

const trackedEntity = new RallyEntity({ ObjectID: '123', Name: 'Original', State: 'Open' });
trackedEntity.Name = 'Updated';
await repo.save(trackedEntity);

assert.deepEqual(writeCalls, [{ type: 'defect', id: '123', data: { Name: 'Updated' } }]);

console.log('Built package consumer smoke test passed.');
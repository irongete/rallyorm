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
assert.equal(Theme.entityType, 'portfolioitem/strategictheme');
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
    queryCount: async () => 2,
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
assert.equal(await repo.count({ State: 'Open' }), 2);

class SmokeProjectModel extends RallyEntity {
    static entityType = 'project';
}

class SmokeStoryModel extends RallyEntity {
    static entityType = 'hierarchicalrequirement';
    static relations = {
        Project: { type: 'belongsTo', entity: 'project', foreignKey: 'Project' }
    };
}

const storyRepo = new RallyRepository('hierarchicalrequirement', {
    query: async () => [],
    get: async (_type, id, options) => {
        assert.equal(id, '321');
        assert.equal(options.fetch, 'ObjectID,Name,Project');
        return {
            ObjectID: 321,
            Name: 'Smoke Story',
            Project: { _ref: '/project/9' }
        };
    },
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    baseUrl: 'https://rally1.rallydev.com/slm/webservice/v2.0'
}, SmokeStoryModel, {
    hierarchicalrequirement: SmokeStoryModel,
    project: SmokeProjectModel
}, dataSource);

storyRepo.relationshipLoader.loadRelationships = async (entity, include) => {
    assert.deepEqual(include, ['Project.Name']);
    entity._data.Project = { _ref: '/project/9', _type: 'project', Name: 'Smoke Project' };
    return entity;
};

const loadedStory = await storyRepo.findOne('321', {
    fetch: ['ObjectID', 'Name', 'Project'],
    include: 'Project.Name'
});

assert.equal(loadedStory.Project.Name, 'Smoke Project');
assert.equal(loadedStory.Project instanceof SmokeProjectModel, true);

console.log('Built package consumer smoke test passed.');
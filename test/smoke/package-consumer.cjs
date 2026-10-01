'use strict';

// CommonJS consumers (a project without "type": "module", or tsx running one) resolve the
// package through the "default" export condition. Plain require() of an ES module needs
// Node >= 20.19 / 22.12; older runtimes only get a clear ERR_REQUIRE_ESM, so skip there.
if (!process.features.require_module) {
    console.log(`Skipped CommonJS consumer smoke test: Node ${process.version} cannot require() ES modules.`);
    process.exit(0);
}

const assert = require('node:assert/strict');
const { RallyDataSource, UserStory } = require('rallyorm');
const { isValidCustomFieldName } = require('rallyorm/utils');

assert.equal(typeof RallyDataSource, 'function');
assert.equal(UserStory.entityType, 'hierarchicalrequirement');
assert.equal(isValidCustomFieldName('c_CustomField'), true);
assert.equal(new RallyDataSource({ apiKey: 'test-key' }).userStories.entityType, 'hierarchicalrequirement');

console.log('Built package CommonJS consumer smoke test passed.');

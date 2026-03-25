# RallyORM

RallyORM is a TypeScript library for working with the Rally API using typed models, repositories, and async/await.

It gives you a higher-level API over Rally entities such as `UserStory`, `Defect`, `Task`, `Project`, `Iteration`, `Release`, `TestCase`, and more.

The package is ESM-only and targets Node.js applications.

## Installation

Requirements:

- Node.js 18 or newer

```bash
npm install rallyorm
```

## What It Includes

- `RallyClient` for low-level API access
- `RallyDataSource` for typed repositories
- `RallyRepository<T>` for common read and write operations
- eager and lazy relationship loading for Rally references
- typed Rally models
- helpers for Rally custom fields

## Main API

- `RallyDataSource` is the usual entry point
- repository getters such as `ds.userStories`, `ds.defects`, `ds.tasks`, `ds.projects` and `ds.testCases` expose typed repositories
- `find`, `findBy`, `findAllBy`, `findOne`, `findOneBy`, `count`, `exists`, and `save` cover the most common repository flows
- `RallyClient` is available when you need lower-level control

## Quick Start

```typescript
import { RallyDataSource } from 'rallyorm';

const ds = new RallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  baseUrl: process.env.RALLY_BASE_URL,
  workspace: process.env.RALLY_WORKSPACE,
  readOnly: true
});

const stories = await ds.userStories.find({
  query: '(ScheduleState = "In-Progress")',
  fetch: ['FormattedID', 'Name', 'Owner.DisplayName'],
  maxResults: 10
});

for (const story of stories) {
  console.log(story.FormattedID, story.Name);
}
```

`apiKey` is required. `workspace` and `baseUrl` are optional.

## Basic Usage

### Read Data

```typescript
const defects = await ds.defects.find({
  query: '(State = "Open")',
  fetch: ['FormattedID', 'Name', 'Priority'],
  maxResults: 20
});

const defect = await ds.defects.findOne('123456');
```

You can also work directly with model classes when that is clearer for the calling code:

```typescript
import { UserStory } from 'rallyorm';

const repo = ds.getRepository(UserStory);
const story = await repo.findOne('123456');
```

### Filter With Repository Helpers

`findBy` and `findAllBy` build Rally queries from plain objects when that reads better than writing raw query strings.

```typescript
const inProgressStories = await ds.userStories.findBy({
  where: {
    ScheduleState: 'In-Progress',
    Project: { ObjectID: 12345 }
  },
  fetch: ['FormattedID', 'Name', 'ScheduleState'],
  order: 'LastUpdateDate desc'
});

const hasOpenDefects = await ds.defects.exists({
  State: 'Open',
  Project: { ObjectID: 12345 }
});
```

Supported helper operators include `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$contains`, `$in`, `$and`, and `$or`.

Use `findAllBy` when you want RallyORM to page through the full result set automatically.

```typescript
const allProjectStories = await ds.userStories.findAllBy({
  where: { Project: { ObjectID: 12345 } },
  fetch: ['FormattedID', 'Name'],
  pagesize: 200
});
```

### Load Relationships

You can eager-load relationships by using dot notation in `fetch` or by passing `include` explicitly.

```typescript
const stories = await ds.userStories.find({
  fetch: ['FormattedID', 'Name', 'Project.Name', 'Owner.DisplayName'],
  maxResults: 10
});

console.log(stories[0].Project.Name);
console.log(stories[0].Owner.DisplayName);
```

`include` accepts either an array or a comma-delimited string.

```typescript
const story = await ds.userStories.findOne('123456', {
  fetch: ['FormattedID', 'Name', 'Project'],
  include: 'Project.Name,Owner.DisplayName'
});
```

When a relationship is eager-loaded, RallyORM exposes it as the corresponding typed model when the model exists in the registry.

### Lazy Relationships

If a relationship is present only as a Rally `_ref` and you do not eager-load it, accessing the property returns a `LazyLink`.

```typescript
const story = await ds.userStories.findOne('123456', {
  fetch: ['FormattedID', 'Name', 'Project']
});

const projectLink = story?.Project;
const project = await projectLink?.load();

console.log(project?.Name);
```

This is useful when you want a lightweight first read and only dereference related entities on demand.

### Write Data

Write operations are disabled by default.

Enable them explicitly when you create the data source:

```typescript
const ds = new RallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  workspace: process.env.RALLY_WORKSPACE,
  allowCreate: true,
  allowUpdate: true,
  allowDelete: true,
  relationshipLoaderOptions: {
    maxDepth: 5,
    maxCacheEntries: 5000
  }
});
```

Create or update through `save`:

```typescript
const defect = await ds.defects.save({
  Name: 'Example defect',
  Description: 'Created with RallyORM'
});

defect.Name = 'Updated defect title';
await ds.defects.save(defect);
```

For production usage, keep writes disabled unless the process really needs them.

String-based tag writes are strict. If RallyORM cannot resolve or create every requested tag, the write fails instead of silently dropping tags from the payload.

### Relationship Loading Limits

Relationship hydration is bounded to protect callers from runaway graphs.

- `relationshipLoaderOptions.maxDepth` controls how many nested include levels RallyORM will traverse. Default is `5`.
- `relationshipLoaderOptions.maxCacheEntries` controls the in-memory relationship reference cache size. Default is `5000`.

```typescript
const ds = new RallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  relationshipLoaderOptions: {
    maxDepth: 3,
    maxCacheEntries: 1000
  }
});
```

When the configured relationship depth is reached, RallyORM stops descending further and logs a warning through the configured client logger.

## Custom Fields

Rally custom fields usually start with `c_`.

```typescript
import { UserStory, createCustomFieldAccessor } from 'rallyorm';

type StoryFields = {
  c_MyField?: string;
};

class MyStory extends UserStory {
  get customFields(): StoryFields {
    return createCustomFieldAccessor<StoryFields>(this);
  }
}

const story = new MyStory({ Name: 'Custom field example' });
story.customFields.c_MyField = 'Hello';
```

## Package Exports

- `rallyorm` exposes the main client, data source, repositories, and models
- `rallyorm/utils` exposes helper utilities for custom fields

## Model Generator

`npx rallyorm generate` emits TypeScript source files.

Generated TypeScript files use `.js` relative import specifiers so they work directly with Node.js ESM after compilation.

When you use the generated models, RallyORM now supports two complementary modes:

- `RallyDataSource` keeps the built-in getters (`testCases`, `defects`, `userStories`, etc.) and will use generated model overrides at runtime when you pass `models: GENERATED_MODELS`.
- `GeneratedRallyDataSource` is emitted alongside the generated models and provides typed getters bound to those generated classes, which is the recommended path when you want IDE autocomplete for workspace-specific and custom fields.

Typical usage in a consumer project:

```typescript
import { GeneratedRallyDataSource } from './src/models/generated/index.js';

const ds = new GeneratedRallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  workspace: process.env.RALLY_WORKSPACE
});

const testCases = await ds.testCases.findAllBy({
  fetch: ['FormattedID', 'Name']
});
```

If you prefer to stay on the base datasource, this also works and still uses generated runtime metadata:

```typescript
import { RallyDataSource } from 'rallyorm';
import { GENERATED_MODELS } from './src/models/generated/index.js';

const ds = new RallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  models: GENERATED_MODELS
});
```

## Development

- Run tests: `npm test`
- Copy `.env.example` to `.env` for local live validation. Keep `.env` untracked and never commit real credentials.
- Run live integration tests explicitly: `RALLY_INTEGRATION=1 npm run test:live`
- Run full release validation with live Rally checks: `npm run release:check:live`
- Publish: `npm publish` (runs `prepublishOnly`, requires live Rally credentials, and blocks unless `release:check:publish` passes)

### Live Validation Environment

The normal release gate does not require real Rally credentials.

Publishing does require live validation against a real Rally environment.

Variables used by the live suite:

- `RALLY_INTEGRATION`: required to opt in to live tests. Use `1` or `true`.
- `RALLY_API_KEY`: required for any live integration run.
- `RALLY_WORKSPACE`: optional workspace ObjectID.
- `RALLY_BASE_URL`: optional WSAPI base URL.
- `RALLY_LOG_LEVEL`: optional client log level for live runs.
- `RALLY_MAX_CONCURRENT_REQUESTS`: optional global concurrency limit for Rally API requests. Default is `10`.
- `RALLY_TEST_PROJECT_OID`: required for live write validation.
- `RALLY_TEST_USERSTORY_OID`: optional fixture ObjectID for targeted scenarios.
- `RALLY_TEST_TESTCASE_OID`: optional fixture ObjectID for targeted scenarios.

Typical local flow:

```bash
npm test
npm run release:check
npm run release:check:live
npm publish
```

`release:check:live` already enables `RALLY_INTEGRATION=1` internally. You still need the corresponding environment variables to be present.

`npm publish` now runs `release:check:publish`, which fails fast unless `RALLY_API_KEY` and `RALLY_TEST_PROJECT_OID` are present and the live suite passes.

## License

MIT

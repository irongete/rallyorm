# RallyORM

[![CI](https://github.com/irongete/rallyorm/actions/workflows/ci.yml/badge.svg)](https://github.com/irongete/rallyorm/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Firongete%2Frallyorm%2Fbadges%2Ftests.json)](https://github.com/irongete/rallyorm/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Firongete%2Frallyorm%2Fbadges%2Fcoverage.json)](https://github.com/irongete/rallyorm/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/rallyorm)](https://www.npmjs.com/package/rallyorm)
[![npm downloads](https://img.shields.io/npm/dm/rallyorm)](https://www.npmjs.com/package/rallyorm)
[![Node.js](https://img.shields.io/node/v/rallyorm)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

RallyORM is a TypeScript library for working with the Rally (Broadcom Rally / CA Agile Central) Web Services API using typed models, repositories, and async/await.

It gives you a higher-level API over Rally entities such as `UserStory`, `Defect`, `Task`, `Project`, `Iteration`, `Release`, `TestCase`, and more, plus a generator that turns your own workspace's type definitions (custom fields included) into typed models.

The package is ESM-only and targets Node.js applications.

## Installation

Requirements:

- Node.js 18 or newer

```bash
npm install rallyorm
```

## What It Includes

- `RallyClient` for low-level API access: retries, rate-limit handling, request queueing, write guards
- `RallyDataSource` for typed repositories
- `RallyRepository<T>` for common read and write operations
- eager and lazy relationship loading for Rally references, including polymorphic collections
- typed Rally models generated from Rally's own type definitions
- `npx rallyorm generate` to produce models for your workspace, custom fields included
- optional progress telemetry for long-running loads
- helpers for Rally custom fields

## Main API

- `RallyDataSource` is the usual entry point
- repository getters such as `ds.userStories`, `ds.defects`, `ds.tasks`, `ds.projects` and `ds.testCases` expose typed repositories
- `find`, `findBy`, `findAllBy`, `findOne`, `findOneBy`, `count`, `exists`, and `save` cover the most common repository flows
- `select` picks the fields to fetch and the relationships to eager-load in one list
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
  select: ['FormattedID', 'Name', 'Owner.DisplayName'],
  maxResults: 10
});

for (const story of stories) {
  console.log(story.FormattedID, story.Name, story.Owner?.DisplayName);
}
```

`apiKey` is required. `workspace` and `baseUrl` are optional (`baseUrl` defaults to `https://rally1.rallydev.com/slm/webservice/v2.0`; use `https://eu1.rallydev.com/slm/webservice/v2.0` for EU tenants).

## Basic Usage

### Read Data

```typescript
const defects = await ds.defects.find({
  query: '(State = "Open")',
  select: ['FormattedID', 'Name', 'Priority'],
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
  select: ['FormattedID', 'Name', 'ScheduleState'],
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
  select: ['FormattedID', 'Name'],
  pagesize: 200
});
```

RallyORM warns through the client logger when a `where` field is not filterable or an `order` field is not sortable according to the model metadata, so typos surface early.

### Select Fields and Relationships

`select` is the single list that drives both the WSAPI `fetch` and relationship eager-loading. It accepts an array or a comma-delimited string.

```typescript
const stories = await ds.userStories.find({
  select: ['FormattedID', 'Name', 'Project.Name', 'Owner.DisplayName'],
  maxResults: 10
});

console.log(stories[0].Project.Name);
console.log(stories[0].Owner.DisplayName);
```

- A plain name (`'Name'`) is fetched as a scalar field. If it is a relationship (`'Tasks'`), the related records are eager-loaded with their default fields.
- A dot path (`'Owner.DisplayName'`) fetches `Owner` and eager-loads it with `DisplayName`. Paths can go as deep as `relationshipLoaderOptions.maxDepth` allows (`'Iteration.Project.Name'`).
- `'*'` fetches every field of the top-level entity (`fetch=true`) and disables eager-loading for that query.

Polymorphic collections such as `TestSet.WorkProducts` mix several entity types. Add a type filter in square brackets to restrict nested loading to one of them:

```typescript
const testSets = await ds.testSets.find({
  select: ['Name', 'WorkProducts[HierarchicalRequirement].TestCases.Name']
});
```

The whole `WorkProducts` collection is still loaded; `TestCases` are only loaded for the work products that are user stories. Only the bracket syntax is treated as a filter, so a relation named like an entity type (`'Iteration.Project.Name'`) is always a plain relation chain.

When a relationship is eager-loaded, RallyORM exposes it as the corresponding typed model when the model exists in the registry.

With models that declare typed properties (the ones emitted by `npx rallyorm generate`, see below), pass the list `as const` and the selected top-level fields become required in the result type while everything else keeps its optional declaration:

```typescript
const [story] = await ds.userStories.find({
  select: ['FormattedID', 'Name'] as const,
  maxResults: 1
});

story.Name;        // string — selected
story.Description; // string | undefined — not selected
```

The built-in models type every field as `any`, so this narrowing only kicks in once you use generated models.

### Lazy Relationships

If a relationship is present only as a Rally `_ref` and you do not eager-load it, accessing the property returns a `LazyLink`.

```typescript
const story = await ds.userStories.findOne('123456', {
  select: ['FormattedID', 'Name', 'Project']
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
  allowDelete: true
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

Entities track their own changes, so saving an existing entity only sends the fields that changed. Fields flagged `readOnly` in the model metadata (`FormattedID`, `CreationDate`, roll-ups, …) are stripped from the payload automatically.

For production usage, keep writes disabled unless the process really needs them.

String-based tag writes are strict. If RallyORM cannot resolve or create every requested tag, the write fails instead of silently dropping tags from the payload.

Validation is opt-in: `entity.validate()` checks required fields, types, lengths, ranges and allowed values against the model metadata and `entity.getErrors()` lists what failed. Nothing is validated implicitly on `save`, so workspaces with customised dropdown values keep working with the built-in models.

### Relationship Loading Limits

Relationship hydration is bounded to protect callers from runaway graphs.

- `relationshipLoaderOptions.maxDepth` controls how many nested levels RallyORM will traverse. Default is `5`.
- `relationshipLoaderOptions.maxCacheEntries` controls the in-memory relationship reference cache size. Default is `5000`.
- `relationshipLoaderOptions.collectionConcurrency` controls how many collection references are resolved in parallel. Default is `10`.
- `relationshipLoaderOptions.inverseQueryChunkSize` controls how many parent references are packed into one inverse query. Default is `50`.

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

### Progress Telemetry

Large `findAllBy` calls and deep relationship loads can take a while. Enable `telemetry: true` to render live progress bars in the terminal, or pass `onProgress` to receive the same events programmatically.

```typescript
const ds = new RallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  telemetry: true,
  onProgress: event => {
    // event.operation: 'query' | 'relationship' | 'collection'
    // event.current / event.total, plus entityType, relationshipName and level
  }
});
```

Polymorphic relationship loads report one bar for the whole relation plus one sub-bar per source entity type.

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

For full typing of your workspace's custom fields, generate models instead (see below).

## Package Exports

- `rallyorm` exposes the main client, data source, repositories, models, `LazyLink`, the error classes and the public types (`IRallyClientConfig`, `IFindOptions`, `SelectResult`, `IRallyProgressEvent`, …)
- `rallyorm/utils` exposes helper utilities for custom fields

## Model Generator

The built-in models cover the standard Rally types. `npx rallyorm generate` reads the type definitions of **your** workspace and emits TypeScript models that include your custom fields, your dropdown values and your portfolio item hierarchy.

```bash
npx rallyorm generate --api-key=$RALLY_API_KEY --workspace=123456789 --output=./src/rally-models
```

Options:

- `--api-key=<key>` — Rally API key (prompted when omitted)
- `--workspace=<id>` — workspace ObjectID (prompted when omitted)
- `--output=<dir>` — output directory, default `./src/models/generated`
- `--base-url=<url>` — WSAPI base URL for non-US tenants
- `--include=Defect,HierarchicalRequirement,...` — generate only these types
- `--base-import=<specifier>` — import specifier for the RallyORM base classes, default `rallyorm`

Generated files use `.js` relative import specifiers so they work directly with Node.js ESM after compilation. The output includes an `index.ts` that exports every model, a `GENERATED_MODELS` array, and a `GeneratedRallyDataSource` with typed getters bound to the generated classes.

`GeneratedRallyDataSource` is the recommended path when you want IDE autocomplete for workspace-specific and custom fields:

```typescript
import { GeneratedRallyDataSource } from './src/rally-models/index.js';

const ds = new GeneratedRallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  workspace: process.env.RALLY_WORKSPACE
});

const testCases = await ds.testCases.findAllBy({
  select: ['FormattedID', 'Name', 'c_MyCustomField']
});
```

If you prefer to stay on the base datasource, register the generated classes with `models`. They override the built-in models with the same entity type, and the built-in getters (`ds.defects`, `ds.userStories`, …) return them:

```typescript
import { RallyDataSource } from 'rallyorm';
import { GENERATED_MODELS } from './src/rally-models/index.js';

const ds = new RallyDataSource({
  apiKey: process.env.RALLY_API_KEY as string,
  models: GENERATED_MODELS
});
```

## Migrating From 1.x

- `fetch` and `include` query options were merged into `select`. Replace `fetch: ['Name', 'Project'], include: 'Project.Name'` with `select: ['Name', 'Project.Name']`. Passing the old keys logs a warning and they are ignored.
- `models: 'generated'` was removed from `RallyDataSource`; pass the `GENERATED_MODELS` array instead.
- The set of built-in models is now generated from Rally type definitions and covers the standard artifact, test, timebox, portfolio and organisation types. Anything else (builds, changesets, capacity planning, …) is available through `npx rallyorm generate`.

## Development

- Run tests: `npm test`
- Run tests with coverage: `npm run coverage` (thresholds in `.c8rc.json`: 88% lines/statements, 85% functions, 80% branches)
- CI runs the release gate on Node 18, 20 and 22 for every push and pull request. Pushes to `main` also refresh the tests and coverage badges, which are served from the `badges` branch through shields.io — no third-party account involved.
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

`npm publish` runs `release:check:publish`, which fails fast unless `RALLY_API_KEY` and `RALLY_TEST_PROJECT_OID` are present and the live suite passes.

## License

MIT

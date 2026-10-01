# RallyORM

[![CI](https://github.com/irongete/rallyorm/actions/workflows/ci.yml/badge.svg)](https://github.com/irongete/rallyorm/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Firongete%2Frallyorm%2Frefs%2Fheads%2Fbadges%2Ftests.json)](https://github.com/irongete/rallyorm/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Firongete%2Frallyorm%2Frefs%2Fheads%2Fbadges%2Fcoverage.json)](https://github.com/irongete/rallyorm/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/rallyorm)](https://www.npmjs.com/package/rallyorm)
[![npm downloads](https://img.shields.io/npm/dm/rallyorm)](https://www.npmjs.com/package/rallyorm)
[![Node.js](https://img.shields.io/node/v/rallyorm)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

RallyORM is a TypeScript library for working with the Rally (Broadcom Rally / CA Agile Central) Web Services API using typed models, repositories, and async/await.

It gives you a higher-level API over Rally entities such as `UserStory`, `Defect`, `Task`, `Project`, `Iteration`, `Release`, `TestCase`, and more, plus a generator that turns your own workspace's type definitions (custom fields included) into typed models.

The package is published as ES modules and targets Node.js applications.

## Installation

Requirements:

- Node.js 18 or newer
- TypeScript 5.0 or newer, if you use TypeScript

```bash
npm install rallyorm
```

### ES modules and CommonJS projects

RallyORM is an ES module. How you load it depends on your project:

- **ES module projects** (`"type": "module"` in `package.json`) use `import { RallyDataSource } from 'rallyorm'` on any supported Node.js version.
- **CommonJS projects** (no `"type": "module"`) also work when run through `tsx`, or on Node.js 20.19+ / 22.12+, which can `require()` ES modules. On older Node.js versions a plain `require('rallyorm')` fails with `ERR_REQUIRE_ESM`: add `"type": "module"` to your `package.json`, or load it with `await import('rallyorm')`.
- **TypeScript**: use `"module": "nodenext"` (TypeScript 5.8 or newer). With `"module": "node16"`, TypeScript rejects importing an ES module from a CommonJS file (`TS1479`).

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

`find` and `findBy` read one page (`pagesize`, default 200; Rally serves at most 2000 per page). With `maxResults` they page through the results until they have that many, so `maxResults: 4000` returns up to 4000 records. `findAllBy` returns every match.

If Rally rejects a query (for example a malformed raw `query` string), the call throws a `RallyOperationError` whose `rallyErrors` carry Rally's message. It does not return an empty list.

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
- A dot path (`'Owner.DisplayName'`) fetches `Owner` with `DisplayName`. Paths can go as deep as `relationshipLoaderOptions.maxDepth` allows (`'Iteration.Project.Name'`).
- Rally fills single related objects (`Owner`, `Project`, `Iteration`, …) in the same request as their parent, at any depth, so `'Owner.DisplayName'` and `'Iteration.Project.Name'` cost no extra requests. Collections (`'Tasks.Name'`) and wildcards (`'Owner.*'`) are loaded with batched extra requests.
- `'*'` fetches every field of the top-level entity (`fetch=true`) and disables eager-loading for that query.

Polymorphic collections such as `TestSet.WorkProducts` mix several entity types. Add a type filter in square brackets to restrict nested loading to one of them:

```typescript
const testSets = await ds.testSets.find({
  select: ['Name', 'WorkProducts[HierarchicalRequirement].TestCases.Name']
});
```

The whole `WorkProducts` collection is still loaded; `TestCases` are only loaded for the work products that are user stories. Only the bracket syntax is treated as a filter, so a relation named like an entity type (`'Iteration.Project.Name'`) is always a plain relation chain.

When a relationship is eager-loaded, RallyORM exposes it as the corresponding typed model when the model exists in the registry.

The models declare every standard field with the type Rally returns. The selected top-level fields become required in the result type, and everything else keeps its optional declaration:

```typescript
const [story] = await ds.userStories.find({
  select: ['FormattedID', 'Name', 'PlanEstimate'],
  maxResults: 1
});

story.Name;          // string — selected
story.PlanEstimate;  // number | null — selected; Rally returns null when it is unset
story.Description;   // string | undefined — not selected
story.ScheduleState; // 'Defined' | 'In-Progress' | … | (string & {}) — suggests Rally's values, accepts your workspace's own
story.Owner;         // any — relations are a loaded model or a LazyLink depending on select
story.c_MyField;     // any — custom fields are not declared on the built-in models
```

This narrowing needs the select list written inline (or `as const`). A list held in a `string[]` variable narrows nothing. The typed declarations need TypeScript 5.0 or newer.

### Lazy Relationships

Rally only returns the fields you fetch, and naming a relationship in `select` eager-loads it. A relationship therefore arrives as a bare reference — exposed as a `LazyLink` — when the record is read without a field list (`findOne(id)` returns every field, relationships included, as references) or with `select: ['*']`. Call `load()` to dereference it on demand:

```typescript
const story = await ds.userStories.findOne('123456');   // every field, relationships as references

const projectLink = story?.Project;                     // LazyLink { _ref, _refObjectName, … }
const project = await projectLink?.load();              // one GET, returns the typed Project model

console.log(project?.Name);
```

This is useful when you want a lightweight first read and only dereference some related entities later. When you already know which relationships you need, `select: ['Project.Name']` is cheaper: the project names come back with the stories instead of costing one request per `load()`.

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

Validation is opt-in: `entity.validate()` checks the writable fields (required, types, lengths, ranges and allowed values) against the model metadata, and `entity.getErrors()` lists what failed. Read-only fields are skipped because Rally fills them in. An entity read from Rally validates as-is: an empty dropdown (`""`, `null`, or `"None"` for ratings) is accepted. Nothing is validated implicitly on `save`, so workspaces with customised dropdown values keep working with the built-in models. To validate against your own dropdown values, generate your models (see below).

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
- `--open-enums` — type dropdown fields as their allowed values plus any other string (`'High' | 'Low' | (string & {})`) instead of only the allowed values. Use it when values may be added after you generate
- `--exclude-custom-fields` — leave out the workspace's custom fields (`c_*`), for models shared across workspaces

Every field is declared with the type Rally returns. Optional fields Rally returns as `null` when unset (numbers, dates, short strings, dropdowns) are typed `| null`. Booleans and long text fields never are. Dropdown types include `""`, and ratings also `"None"`, which is how Rally reports an empty rating.

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

## Contributing

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development, testing and release workflow.

## License

MIT

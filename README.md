# RallyORM

RallyORM is a TypeScript library for working with the Rally API using typed models, repositories, and async/await.

It gives you a higher-level API over Rally entities such as `UserStory`, `Defect`, `Task`, `Project`, `Iteration`, `Release`, `TestCase`, and more.

The package is ESM-only and targets Node.js applications.

## Installation

Requirements:

- Node.js 18 or newer
- ESM runtime

```bash
npm install rallyorm
```

## What It Includes

- `RallyClient` for low-level API access
- `RallyDataSource` for typed repositories
- `RallyRepository<T>` for common read and write operations
- typed Rally models
- helpers for Rally custom fields

## Main API

- `RallyDataSource` is the usual entry point
- repository getters such as `ds.userStories`, `ds.defects`, `ds.tasks`, `ds.projects` and `ds.testCases` expose typed repositories
- `find`, `findOne`, and `save` cover the most common read and write flows
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

For production usage, keep writes disabled unless the process really needs them.

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

## Development

- Run tests: `npm test`
- Run live integration tests explicitly: `RALLY_INTEGRATION=1 npm run test:live`
- Run full release validation: `npm run release:check:live`
- Publish: `npm publish` (runs `prepublishOnly` and blocks if `release:check` fails)

## License

MIT

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2026-09-17

Found by auditing the query builder, `save()` and the lazy-loading path for inputs that were
turned into silence instead of the right query or an error.

### Fixed

- **`LazyLink.load()` never worked against Rally.** It passed the whole `_ref` to `findOne()`, which
  appended it to the entity path (`/project/https://…/project/42`) and got a 404. `findOne()` and
  `RallyClient.get()` now accept a relative or absolute ref in place of an ObjectID.
- **`save()` created duplicates for entities loaded without `ObjectID`.** Rally always returns `_ref`
  but only returns `ObjectID` when selected; `save()` decided create-vs-update on `ObjectID` alone.
  It now derives the id from `_ref`, and refuses to save an entity whose `_ref` yields no id.
  `remove()` accepts `_ref`-only entities the same way.
- **Empty lists silently widened queries to everything.** `{ Field: [] }`, `{ Field: { $in: [] } }` and
  `$or: []` dropped their condition; they now translate to a predicate that matches nothing
  (`(ObjectID = 0)`), so `where: { ObjectID: { $in: idsFromAnotherQuery } }` returns no rows when
  the list is empty. `null` items inside `$in` become `(Field = null)` alternatives instead of being
  discarded, and a non-array `$in` operand throws `RallyValidationError`.
- **`Date` values in `where` produced wrong results.** They were serialised with `Date#toString()`
  (a locale string Rally silently mismatches: `CreationDate > someDate` returned 0 rows) and, as a
  plain value, were mistaken for a nested filter object and dropped. Dates are now ISO 8601 in every
  position; an invalid `Date` throws.

### Changed

- README: the *Lazy Relationships* example selected the relationship, which eager-loads it in 2.x;
  it now shows the case that actually yields a `LazyLink`.
- The live write suite covers `save()` on an entity loaded without `ObjectID`.

## [2.0.1] - 2026-09-17

### Fixed

- `where` operators `$eq` / `$ne` with a `null` operand now produce Rally's `(Field = null)` /
  `(Field != null)`. They were silently dropped, so `{ WorkProduct: { $ne: null } }` queried without
  any filter and returned the whole entity type. Other operators reject `null` with a
  `RallyValidationError`; `undefined` operands are still skipped as optional filters.
- `findOne()` throws `RallyValidationError` when called without an ObjectID or `where` object
  (`undefined`, `null`, blank string). It previously fell through to an unfiltered query and returned
  an arbitrary entity of the type — typically after an `ObjectID` that was never selected.

## [2.0.0] - 2026-09-17

First release published to npm. Versions 1.0.0 and 1.1.0 below only ever existed in the
repository history.

### Added

- **Model generator CLI** — `npx rallyorm generate` reads the TypeDefinitions of a workspace
  and emits TypeScript models with typed property declarations (enum values become literal
  unions), field metadata, relations, a `GENERATED_MODELS` array and a `GeneratedRallyDataSource`
  with typed getters. Flags: `--api-key`, `--workspace`, `--output`, `--base-url`, `--include`,
  `--base-import`. Duplicate type names coming from several workspace contexts are deduplicated.
- **Dynamic model registry** — `RallyDataSource({ models: [...] })` registers extra model classes
  at runtime. They override the built-in model with the same `entityType`, and the built-in getters
  (`ds.defects`, `ds.userStories`, …) return the override. `getModelRegistry()` exposes the result.
- **Unified `select` query option** replacing `fetch` + `include`. Plain names are fetched as
  scalars or eager-loaded when they name a relation; dot paths (`'Owner.DisplayName'`) fetch the
  base field and eager-load the nested path; `'*'` maps to `fetch=true`.
- **Type-filtered eager loading** for polymorphic collections:
  `'WorkProducts[HierarchicalRequirement].TestCases'` loads the whole collection but only descends
  into work products of the given type.
- **Typed `select` results** — `SelectResult<T, S>` and `IFindOptionsWithSelect<S>` (exported from the
  package root). With a model that declares typed properties and a select list passed `as const`,
  the selected top-level fields become required in the result type.
- **Progress telemetry** — `telemetry: true` renders live progress bars for paginated queries and
  relationship loads as a sticky terminal header, buffering log output underneath; `onProgress`
  receives the same `IRallyProgressEvent`s programmatically. Polymorphic relation loads report one
  shared bar plus a sub-bar per source entity type.
- **Richer field metadata** — `IFieldDefinition` gained `isCustom`, `hidden`, `filterable`,
  `sortable`, `maxFractionalDigits` and `note`; `IRelationDefinition` gained `readOnly`. The engine
  uses it: read-only fields are stripped from create/update payloads, `where` clauses on
  non-filterable fields and `order` on non-sortable fields log a warning, and `validate()` checks
  `maxFractionalDigits`.
- **Relationship loader options** `collectionConcurrency` (default `10`) and
  `inverseQueryChunkSize` (default `50`); large inverse queries are chunked. Scalar leaves in a
  select list are skipped silently instead of being treated as unknown relations.
- **New built-in models** `Workspace`, `WorkspaceConfiguration`, `Initiative` and `StrategicTheme`
  (exported as `Theme`), plus `ds.workspaces`, `ds.workspaceConfigurations`, `ds.initiatives`.
- `RALLY_MAX_CONCURRENT_REQUESTS` environment variable as the default request-queue concurrency.
- Release tooling: `release:check` (lint, tests, build, built-package smoke test, `npm pack`
  dry run), `release:check:live`, and a `prepublishOnly` gate that refuses to publish without a
  passing live Rally validation. Live integration suites for reads, fixtures and sandbox writes.

### Changed

- **Breaking:** `IFindOptions.fetch` and `IFindOptions.include` were replaced by `select`.
  Passing the old keys logs a warning and they are ignored.
- **Breaking:** the built-in models are now generated from Rally metadata and limited to the
  standard artifact, test, timebox, portfolio and organisation types (`Attachment`, `Defect`,
  `Feature`, `HierarchicalRequirement`/`UserStory`, `Initiative`, `Iteration`, `Milestone`,
  `Project`, `Release`, `StrategicTheme`/`Theme`, `Tag`, `Task`, `TestCase`, `TestCaseResult`,
  `TestCaseStep`, `TestFolder`, `TestSet`, `User`, `Workspace`, `WorkspaceConfiguration`).
  The hand-written models and datasource getters for every other type (builds, changesets, VSM,
  capacity planning, apps, analytics, permissions, …) were removed; generate them for your
  workspace with `npx rallyorm generate` instead.
- **Breaking:** `UserStory` is an alias of the `HierarchicalRequirement` class and `Theme` an
  alias of `StrategicTheme`, whose `entityType` is `portfolioitem/strategictheme`
  (previously `portfolioitem/theme`).
- Model field validation is opt-in (`entity.validate()` / `getErrors()`); nothing is validated
  implicitly on `save`.

### Removed

- **Breaking:** the `models: 'generated'` datasource option. It loaded a stub from inside the
  package that is always empty in a consumer's `node_modules`. Pass the generated `GENERATED_MODELS`
  array (or use `GeneratedRallyDataSource`) instead.
- The dot-notation type filter (`'WorkProducts.HierarchicalRequirement.TestCases'`) that existed
  briefly during development: it treated any segment matching a registered entity type as a filter
  and broke ordinary paths such as `'Iteration.Project.Name'`. Only the bracket syntax is supported.

## [1.1.0] - 2025-05-21

### Added

- **Typed error hierarchy** — `RallyError` base class plus `RallyValidationError`,
  `RallyPermissionError`, `RallyOperationError` (carries `.rallyErrors[]` / `.rallyWarnings[]`),
  `RallyNetworkError` (carries `.statusCode`), and `RallyTimeoutError`. All six classes are
  exported from the package root, enabling consumer-side `instanceof` discrimination.
- **Injectable logger** — `IRallyClientConfig.logger` option accepts any `IRallyLogger` instance,
  bypassing the internal level-based console logger (e.g. for pino/winston integration).
- **Independent concurrency retry count** — `IRallyClientConfig.concurrencyRetries` decouples
  Rally logical concurrency-conflict retries from HTTP-level `retries`. Defaults to `retries`
  for full backward compatibility.
- **True LRU cache eviction** in `RelationshipLoader`: accessed entries are promoted to
  most-recently-used position so frequently read relationships are never evicted under load
  while the cache is below capacity.

### Changed

- All input-validation errors now throw `RallyValidationError` instead of `Error`.
- All write-permission errors now throw `RallyPermissionError` instead of `Error`.
- All Rally API operation failures now throw `RallyOperationError` instead of `Error`.
- HTTP / network errors now throw `RallyNetworkError`; timeouts throw `RallyTimeoutError`.
- `RallyRepository.save()` and `RallyRepository.create()` JSDoc now documents the
  non-atomic nature of string-based Tag resolution.

## [1.0.0] - 2025-05-20

### Added

- **RallyClient** — HTTP transport with authentication (`apiKey` or `zsessionid`), configurable concurrency queue via `p-queue`, automatic retry via `p-retry`, and write-permission guards.
- **RallyDataSource** — Factory and dependency-injection hub that wires together the client, repository, relationship loader, and model registry. Exposes typed `getRepository<T>()` helpers.
- **RallyRepository<T>** — Full CRUD repository pattern (`find`, `findBy`, `findAllBy`, `findOne`, `save`, `update`, `delete`, `remove`, `count`, `exists`) with a structured query builder supporting `$and`, `$or`, `$in`, `$contains`, and comparison operators.
- **RelationshipLoader** — Eager relationship loading with a bounded LRU cache, parallel loading capped by `RALLY_MAX_CONCURRENT_REQUESTS`, configurable depth, and support for `belongsTo`, `hasMany`, `collection`, and `inverseForeignKey` relation types.
- **RallyEntity** — Proxy-based model with dirty tracking, field-level validation (required, minLength, maxLength, min, max, enum, refType), and lazy loading via `LazyLink`.
- **Model registry** — Built-in typed models for Defect, UserStory, Feature, Task, TestCase, TestCaseStep, TestCaseResult, TestSet, TestFolder, Iteration, Release, Project, User, Tag, Attachment, Build, BuildDefinition, Changeset, Connection, Milestone, and many more. Custom models supported via `RallyEntity` extension.
- **Custom fields** — First-class support for Rally custom fields via `getCustomFields()` utility.
- **ESM-only package** — Pure ES module distribution targeting Node.js ≥18.
- **TypeScript typings** — Full declaration files shipped in `dist/`.

### Fixed

- Eliminated double serialization of entity data when `save()` is called for new (un-tracked) entities: the internal `_prepareSaveData` was previously invoked twice before the HTTP create request.

[2.0.2]: https://github.com/irongete/rallyorm/releases/tag/v2.0.2
[2.0.1]: https://github.com/irongete/rallyorm/releases/tag/v2.0.1
[2.0.0]: https://github.com/irongete/rallyorm/releases/tag/v2.0.0
[1.1.0]: https://github.com/irongete/rallyorm/commit/40dc501
[1.0.0]: https://github.com/irongete/rallyorm/commit/66b505f

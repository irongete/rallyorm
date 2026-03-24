# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/your-org/rallyorm/releases/tag/v1.0.0

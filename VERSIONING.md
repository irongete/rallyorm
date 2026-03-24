# Versioning Policy

This project follows Semantic Versioning.

## Version Meanings

- `MAJOR`: breaking public API or behavior changes
- `MINOR`: backward-compatible features and new supported models
- `PATCH`: backward-compatible fixes, documentation fixes and tooling improvements

## Public API Scope

The public API is defined by the package root exports and documented usage in the README and docs.

Changes to internal implementation details should not be treated as breaking unless they alter documented runtime behavior, emitted types or supported imports.

## Release Rules

Before publishing a new version:

1. update `CHANGELOG.md`
2. run `npm run release:check`
3. verify the generated tarball contents
4. document any migration notes for breaking changes

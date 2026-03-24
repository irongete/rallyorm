# Contributing

## Development Setup

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Run `npm run release:check` before opening a pull request.

## Workflow

- Keep changes focused and minimal.
- Preserve the public API unless the change is intentional and documented.
- Add or update tests for behavior changes.
- Update documentation when behavior, compatibility or workflows change.

## Quality Gates

- `npm run lint`
- `npm run test`
- `npm run test:live` when Rally credentials are available
- `npm run build`
- `npm run release:check`

## Pull Requests

Include the following in each pull request:

- what changed
- why it changed
- any public API impact
- test coverage added or updated
- documentation updates, if applicable

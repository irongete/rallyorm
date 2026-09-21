# Contributing

## Development

- Run tests: `npm test`
- Run tests with coverage: `npm run coverage` (thresholds in `.c8rc.json`: 88% lines/statements, 85% functions, 80% branches)
- Run the full release gate (build + tests + coverage): `npm run release:check`
- CI runs the release gate on Node 18, 20 and 22 for every push and pull request.

## Live Integration Tests (Optional)

Most of the test suite runs without any Rally credentials. A separate live suite exercises the real Rally WSAPI and is only needed if you're changing request/response handling and want to validate against a live workspace.

- Copy `.env.example` to `.env` for local live validation. Keep `.env` untracked and never commit real credentials.
- Run it explicitly: `RALLY_INTEGRATION=1 npm run test:live`

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

## Releasing

Publishing to npm is limited to maintainers. See [RELEASING.md](RELEASING.md).

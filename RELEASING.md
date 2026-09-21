# Releasing

This is a maintainer-only reference for cutting a release of `rallyorm`. Publishing to npm requires access to the `rallyorm` package and a live Rally environment for validation.

Typical flow:

```bash
npm test
npm run release:check
npm run release:check:live
npm publish
```

- `release:check` runs the build, tests and coverage gate. It does not require real Rally credentials.
- `release:check:live` runs the same gate plus the live integration suite against a real Rally workspace. It enables `RALLY_INTEGRATION=1` internally — the environment variables below still need to be present.
- `npm publish` runs `prepublishOnly`, which shells out to `release:check:publish`. That script fails fast unless `RALLY_API_KEY` and `RALLY_TEST_PROJECT_OID` are present and the live suite passes.

Pushes to `main` also refresh the tests and coverage badges, which are served from the `badges` branch through shields.io — no third-party account involved.

## Environment Variables

- `RALLY_API_KEY`: required to publish.
- `RALLY_WORKSPACE`: optional workspace ObjectID.
- `RALLY_BASE_URL`: optional WSAPI base URL.
- `RALLY_LOG_LEVEL`: optional client log level for live runs.
- `RALLY_MAX_CONCURRENT_REQUESTS`: optional global concurrency limit for Rally API requests. Default is `10`.
- `RALLY_TEST_PROJECT_OID`: required for live write validation and publishing.
- `RALLY_TEST_USERSTORY_OID`: optional fixture ObjectID for targeted scenarios.
- `RALLY_TEST_TESTCASE_OID`: optional fixture ObjectID for targeted scenarios.

Keep `.env` untracked and never commit real credentials.

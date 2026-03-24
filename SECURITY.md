# Security Policy

## Supported Versions

Security fixes are applied to the latest published version.

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities.

Send a report to `irongete@gmail.com` with:

- a clear description of the issue
- impact assessment
- reproduction steps or proof of concept
- affected versions

You will receive an acknowledgement as soon as possible. Valid reports will be investigated privately and fixed before public disclosure whenever feasible.

## Secrets and Credentials

- Never commit Rally API keys.
- Prefer environment variables such as `RALLY_API_KEY`.
- Keep write permissions disabled unless they are explicitly required.

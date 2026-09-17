/**
 * Turns the c8 summary and the mocha JSON report into shields.io "endpoint" badges.
 *
 * Inputs (produced by `npm run coverage:badges`):
 *   coverage/coverage-summary.json  — c8 `json-summary` reporter
 *   coverage/mocha.json             — mocha `json` reporter
 *
 * Outputs (published to the `badges` branch by CI):
 *   coverage/badges/coverage.json
 *   coverage/badges/tests.json
 *
 * Badge schema: https://shields.io/badges/endpoint-badge
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const coverageDir = path.resolve('coverage');
const outputDir = path.join(coverageDir, 'badges');

function readJson(fileName) {
    const filePath = path.join(coverageDir, fileName);
    try {
        return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`coverage-badges: cannot read ${filePath} (${error.message}). Run \`npm run coverage:badges\` first.`);
        process.exit(1);
    }
}

function coverageColor(pct) {
    if (pct >= 90) return 'brightgreen';
    if (pct >= 80) return 'green';
    if (pct >= 70) return 'yellowgreen';
    if (pct >= 60) return 'yellow';
    return 'red';
}

const summary = readJson('coverage-summary.json');
const mocha = readJson('mocha.json');

const linesPct = Number(summary.total.lines.pct);
const branchesPct = Number(summary.total.branches.pct);
const { passes = 0, failures = 0, pending = 0 } = mocha.stats ?? {};

const badges = {
    'coverage.json': {
        schemaVersion: 1,
        label: 'coverage',
        message: `${linesPct.toFixed(1)}% lines · ${branchesPct.toFixed(1)}% branches`,
        color: coverageColor(Math.min(linesPct, branchesPct))
    },
    'tests.json': {
        schemaVersion: 1,
        label: 'tests',
        message: failures > 0
            ? `${failures} failed · ${passes} passed`
            : `${passes} passed${pending > 0 ? ` · ${pending} pending` : ''}`,
        color: failures > 0 ? 'red' : 'brightgreen'
    }
};

mkdirSync(outputDir, { recursive: true });

for (const [fileName, badge] of Object.entries(badges)) {
    writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(badge, null, 2)}\n`);
    console.log(`coverage-badges: ${fileName} → ${badge.label}: ${badge.message} (${badge.color})`);
}

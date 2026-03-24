import 'dotenv/config';

import { RallyDataSource } from '../../src/core/rally-datasource.js';
import type { IRallyClientConfig } from '../../src/core/rally-client.js';

export interface IIntegrationConfig {
    enabled: boolean;
    apiKey?: string;
    workspace?: string;
    baseUrl?: string;
    testProjectOid?: string;
    testUserStoryOid?: string;
    testTestCaseOid?: string;
}

function getIntegrationLogLevel(): IRallyClientConfig['logLevel'] {
    const value = process.env.RALLY_LOG_LEVEL;

    switch (value) {
        case 'silent':
        case 'error':
        case 'warn':
        case 'info':
        case 'debug':
            return value;
        default:
            return 'warn';
    }
}

export function loadIntegrationConfig(): IIntegrationConfig {
    const enabled = process.env.RALLY_INTEGRATION === '1' || process.env.RALLY_INTEGRATION === 'true';

    return {
        enabled,
        apiKey: process.env.RALLY_API_KEY,
        workspace: process.env.RALLY_WORKSPACE,
        baseUrl: process.env.RALLY_BASE_URL,
        testProjectOid: process.env.RALLY_TEST_PROJECT_OID,
        testUserStoryOid: process.env.RALLY_TEST_USERSTORY_OID,
        testTestCaseOid: process.env.RALLY_TEST_TESTCASE_OID
    };
}

export function createIntegrationDataSource(config: IIntegrationConfig): RallyDataSource {
    if (!config.apiKey) {
        throw new Error('RALLY_API_KEY is required for live integration tests');
    }

    return new RallyDataSource({
        apiKey: config.apiKey,
        workspace: config.workspace,
        baseUrl: config.baseUrl,
        logLevel: getIntegrationLogLevel(),
        readOnly: true
    });
}

export function createWritableIntegrationDataSource(config: IIntegrationConfig): RallyDataSource {
    if (!config.apiKey) {
        throw new Error('RALLY_API_KEY is required for live integration tests');
    }

    return new RallyDataSource({
        apiKey: config.apiKey,
        workspace: config.workspace,
        baseUrl: config.baseUrl,
        logLevel: getIntegrationLogLevel(),
        readOnly: false,
        allowCreate: true,
        allowUpdate: true,
        allowDelete: true
    });
}

export function getIntegrationSkipReason(config: IIntegrationConfig): string | null {
    if (!config.enabled) {
        return 'Set RALLY_INTEGRATION=1 to enable live Rally integration tests.';
    }

    if (!config.apiKey) {
        return 'Set RALLY_API_KEY to run live Rally integration tests.';
    }

    return null;
}

export function getWriteIntegrationSkipReason(config: IIntegrationConfig): string | null {
    const baseReason = getIntegrationSkipReason(config);
    if (baseReason) {
        return baseReason;
    }

    if (!config.testProjectOid) {
        return 'Set RALLY_TEST_PROJECT_OID to run live Rally write integration tests.';
    }

    return null;
}
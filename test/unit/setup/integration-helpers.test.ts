import { expect } from 'chai';

import { getIntegrationSkipReason, loadIntegrationConfig } from '../../setup/integration-helpers.js';

describe('Integration Helpers', () => {
    const originalEnv = {
        RALLY_INTEGRATION: process.env.RALLY_INTEGRATION,
        RALLY_API_KEY: process.env.RALLY_API_KEY
    };

    afterEach(() => {
        if (originalEnv.RALLY_INTEGRATION === undefined) {
            delete process.env.RALLY_INTEGRATION;
        } else {
            process.env.RALLY_INTEGRATION = originalEnv.RALLY_INTEGRATION;
        }

        if (originalEnv.RALLY_API_KEY === undefined) {
            delete process.env.RALLY_API_KEY;
        } else {
            process.env.RALLY_API_KEY = originalEnv.RALLY_API_KEY;
        }
    });

    it('should require the explicit live-integration opt-in flag', () => {
        delete process.env.RALLY_INTEGRATION;
        process.env.RALLY_API_KEY = 'test-key';

        const config = loadIntegrationConfig();

        expect(config.enabled).to.equal(false);
        expect(getIntegrationSkipReason(config)).to.equal('Set RALLY_INTEGRATION=1 to enable live Rally integration tests.');
    });

    it('should require Rally credentials after the live-integration opt-in flag is set', () => {
        process.env.RALLY_INTEGRATION = '1';
        delete process.env.RALLY_API_KEY;

        const config = loadIntegrationConfig();

        expect(config.enabled).to.equal(true);
        expect(getIntegrationSkipReason(config)).to.equal('Set RALLY_API_KEY to run live Rally integration tests.');
    });
});
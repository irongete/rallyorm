import { RallyEntity } from '../base-entity.js';

/**
 * LdapConfiguration
 *
 * Configuration settings for LDAP authentication.
 */
export class LdapConfiguration extends RallyEntity {
    static entityType = 'ldapconfiguration';
    static fields = {
        Server: { type: 'string' },
        Port: { type: 'number' },
        _ref: { type: 'string' }
    };
    static relations = {};
}

export default LdapConfiguration;

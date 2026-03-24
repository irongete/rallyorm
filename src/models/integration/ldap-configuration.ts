import { RallyEntity } from '../base-entity.js';

/**
 * Ldap-configuration entity.
 *
 * Represents the LDAP authentication configuration stored for a Rally
 * environment.
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

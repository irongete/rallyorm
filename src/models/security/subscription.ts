import { RallyEntity } from '../base-entity.js';

/**
 * Subscription
 *
 * Rally subscription configuration - the top-level tenant/organization.
 * Contains subscription-wide settings, security policies, and feature flags.
 *
 * **Warning**: This model has 92 fields. Only implementing most critical ones.
 */
export class Subscription extends RallyEntity {
    static entityType = 'subscription';

    static fields = {
        Name: {
            type: 'string'
        },

        // API & Security
        ApiKeysEnabled: {
            type: 'boolean'
        },
        AuthenticationPolicy: {
            type: 'string'
        },
        AuthenticationPolicyUrl: {
            type: 'string'
        },
        ApplyIpAddressRestrictionToSubAdmins: {
            type: 'boolean'
        },

        // CORS
        CORSEnabled: {
            type: 'boolean'
        },
        CORSAllowedDomains: {
            type: 'array'
        },

        // Attachments
        AttachmentFilenameExtensionsEnabled: {
            type: 'boolean'
        },
        AttachmentFilenameExtensionWhitelist: {
            type: 'array'
        },

        // Features
        IterationTrackingEnabled: {
            type: 'boolean'
        },
        ReleaseTrackingEnabled: {
            type: 'boolean'
        },
        StoryHierarchyEnabled: {
            type: 'boolean'
        },

        // Metadata
        CreationDate: {
            type: 'string'
        },
        ObjectID: {
            type: 'number'
        },
        _ref: {
            type: 'string'
        },
        _type: {
            type: 'string'
        }
    };

    static relations = {};
}

export default Subscription;

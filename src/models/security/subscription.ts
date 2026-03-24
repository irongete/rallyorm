import { RallyEntity } from '../base-entity.js';

/**
 * Subscription entity.
 *
 * Represents the top-level Rally subscription or tenant configuration,
 * including organization-wide settings, policies, and feature flags.
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

import { RallyEntity } from '../base-entity.js';

/**
 * Profile-image entity.
 *
 * Represents the avatar or profile-image content associated with a Rally user.
 */
export class ProfileImage extends RallyEntity {
    static entityType = 'profileimage';

    static fields = {
        /**
         * Base64-encoded image content for the user avatar.
         */
        Content: {
            type: 'string'
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

export default ProfileImage;

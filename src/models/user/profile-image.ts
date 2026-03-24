import { RallyEntity } from '../base-entity.js';

/**
 * ProfileImage
 *
 * User's profile image/avatar content.
 */
export class ProfileImage extends RallyEntity {
    static entityType = 'profileimage';

    static fields = {
        Content: {
            type: 'string'
            // Base64 encoded image
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

import { RallyEntity } from '../base-entity.js';

/**
 * Ppm-connection entity.
 *
 * Represents a connection from Rally to an external project or portfolio
 * management system so higher-level planning data can stay aligned.
 */
export class PPMConnection extends RallyEntity {
    static entityType = 'ppmconnection';
    static fields = {
        Name: { type: 'string' },
        Url: { type: 'string' },
        _ref: { type: 'string' }
    };
    static relations = {};
}

export default PPMConnection;

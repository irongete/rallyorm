import { RallyEntity } from '../base-entity.js';

/**
 * PPMConnection
 *
 * Connection to a project portfolio management system.
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

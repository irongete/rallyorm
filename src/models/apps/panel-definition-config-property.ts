import { RallyEntity } from '../base-entity.js';

/**
 * PanelDefinitionConfigProperty
 *
 * Configuration property supported by a dashboard panel definition.
 */
export class PanelDefinitionConfigProperty extends RallyEntity {
    static entityType = 'paneldefinitionconfigproperty';

    static fields = {
        Name: { type: 'string' },
        Value: { type: 'string' },
        _ref: { type: 'string' }
    };

    static relations = {};
}

export default PanelDefinitionConfigProperty;

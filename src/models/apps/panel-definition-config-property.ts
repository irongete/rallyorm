import { RallyEntity } from '../base-entity.js';

/**
 * Panel-definition-config-property entity.
 *
 * Represents a configurable property exposed by a Rally dashboard panel
 * definition so panel instances can persist supported settings.
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

import { RallyEntity } from '../base-entity.js';

/**
 * PublishedCapacityPlan
 *
 * Finalized capacity plan record.
 */
export class PublishedCapacityPlan extends RallyEntity {
    static entityType = 'publishedcapacityplan';
    static isAbstract = false;

    static fields = {
        Name: { type: 'string', maxLength: 256 },
        Notes: { type: 'string', nullable: true },
        StartDate: { type: 'string' },
        EndDate: { type: 'string' },
        CapacityPlanStatus: { type: 'string', nullable: true },
        CapacityPlanItems: { type: 'collection', refType: 'CapacityPlanItem' },
        CapacityPlanProjects: { type: 'collection', refType: 'CapacityPlanProject' },
        Assignments: { type: 'collection', refType: 'CapacityPlanAssignment' },
        PlannedCapacityCount: { type: 'number', nullable: true },
        PlannedCapacityPoints: { type: 'number', nullable: true },
        ActualCapacityCount: { type: 'number', nullable: true },
        ActualCapacityPoints: { type: 'number', nullable: true },
        PublishedDate: { type: 'string', nullable: true },
        Version: { type: 'number', nullable: true },
        CreationDate: { type: 'string', readOnly: true },
        LastUpdateDate: { type: 'string', readOnly: true },
        ObjectID: { type: 'integer', readOnly: true },
        ObjectUUID: { type: 'string', readOnly: true },
        _ref: { type: 'string' },
        Workspace: { type: 'ref', refType: 'Workspace' },
        CreatedBy: { type: 'ref', refType: 'User', readOnly: true },
        RevisionHistory: { type: 'ref', refType: 'RevisionHistory', readOnly: true }
    };

    static relations = {
        Workspace: { type: 'belongsTo', entity: 'workspace', foreignKey: 'Workspace' },
        CreatedBy: { type: 'belongsTo', entity: 'user', foreignKey: 'CreatedBy' },
        RevisionHistory: { type: 'belongsTo', entity: 'revisionhistory', foreignKey: 'RevisionHistory' }
    };
}

export default PublishedCapacityPlan;

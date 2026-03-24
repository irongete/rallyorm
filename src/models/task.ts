import { Artifact } from './base/artifact.js';

/**
 * Task entity.
 *
 * Represents the smallest unit of planned work in Rally, typically used to
 * break down a story or defect into concrete execution steps.
 *
 * @remarks Task extends {@link Artifact} directly rather than
 * {@link SchedulableArtifact}, and uses `State` instead of `ScheduleState`.
 */
export class Task extends Artifact {
    static entityType = 'task';
    static isAbstract = false;

    static fields = {
        ...Artifact.fields,

        // Scheduling (uses Iteration/Release but not ScheduleState)
        /**
         * Iteration this task is scheduled in
         */
        Iteration: {
            type: 'ref',
            refType: 'Iteration',
            nullable: true
        },
        /**
         * Release this task is targeted for
         */
        Release: {
            type: 'ref',
            refType: 'Release',
            nullable: true
        },

        // Blocking
        /**
         * Whether this task is blocked
         */
        Blocked: {
            type: 'boolean',
            nullable: true
        },
        /**
         * Reason for being blocked
         */
        BlockedReason: {
            type: 'string',
            nullable: true
        },

        // Task state (uses State, not ScheduleState)
        /**
         * Task state: Defined, In-Progress, Completed
         */
        State: {
            type: 'string',
            enum: ['Defined', 'In-Progress', 'Completed', 'None'],
            default: 'Defined'
        },

        // Work tracking
        /**
         * Estimated hours
         */
        Estimate: {
            type: 'number',
            nullable: true
        },
        /**
         * Actual hours worked
         */
        Actuals: {
            type: 'number',
            nullable: true
        },
        /**
         * Remaining hours
         */
        ToDo: {
            type: 'number',
            nullable: true
        },
        /**
         * Time spent (read-only, calculated)
         */
        TimeSpent: {
            type: 'number',
            readOnly: true,
            nullable: true
        },

        // Ordering
        /**
         * Task ordering index within work product
         */
        TaskIndex: {
            type: 'integer'
        },

        // Parent work product
        /**
         * Parent work product (UserStory or Defect)
         */
        WorkProduct: {
            type: 'ref',
            refType: 'Artifact'
        }
    };

    static relations = {
        ...Artifact.relations,

        Iteration: {
            type: 'belongsTo',
            entity: 'iteration',
            foreignKey: 'Iteration'
        },
        Release: {
            type: 'belongsTo',
            entity: 'release',
            foreignKey: 'Release'
        },
        WorkProduct: {
            type: 'belongsTo',
            entity: 'artifact',
            foreignKey: 'WorkProduct'
        }
    };
}

export default Task;

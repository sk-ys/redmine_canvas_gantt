import type { DraftRelation, Relation, Task } from '../types';
import { RelationType, type DefaultRelationType } from '../types/constraints';
import { i18n } from './i18n';

const DELAY_ENABLED_RELATIONS: ReadonlySet<string> = new Set([RelationType.Precedes, RelationType.Follows]);

export type RelationDirection = 'forward' | 'reverse';

export type EditableRelationView = {
    uiType: DefaultRelationType;
    direction: RelationDirection;
    fromId: string;
    toId: string;
    delay?: number;
};

type DelayTask = Pick<Task, 'startDate' | 'dueDate'>;
type DelayConsistencyResult = { valid: true } | { valid: false; message: string };

const getNonWorkingWeekDays = (): Set<number> => {
    const fallback = new Set<number>([0, 6]);
    if (typeof window === 'undefined') return fallback;

    const raw = window.RedmineCanvasGantt?.nonWorkingWeekDays;
    if (!Array.isArray(raw)) return fallback;

    const normalized = raw
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

    return normalized.length > 0 ? new Set(normalized) : fallback;
};

const toUtcDayStart = (timestamp: number): Date => {
    const date = new Date(timestamp);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

const addWorkingDays = (timestamp: number, days: number, nonWorkingWeekDays: Set<number>): number => {
    const date = toUtcDayStart(timestamp);
    let remaining = Math.max(0, Math.floor(days));

    while (remaining > 0) {
        date.setUTCDate(date.getUTCDate() + 1);
        if (!nonWorkingWeekDays.has(date.getUTCDay())) {
            remaining -= 1;
        }
    }

    return date.getTime();
};

const countWorkingDaysBetween = (startTimestamp: number, endTimestamp: number, nonWorkingWeekDays: Set<number>): number => {
    const cursor = toUtcDayStart(startTimestamp);
    const end = toUtcDayStart(endTimestamp).getTime();
    let count = 0;

    while (cursor.getTime() < end) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        if (!nonWorkingWeekDays.has(cursor.getUTCDay())) {
            count += 1;
        }
    }

    return count;
};

export const supportsDelayForUiType = (relationType: DefaultRelationType): boolean =>
    relationType === RelationType.Precedes;

export const toEditableRelationView = (relation: Relation | DraftRelation): EditableRelationView => {
    switch (relation.type) {
        case RelationType.Follows:
            return {
                uiType: RelationType.Precedes,
                direction: 'reverse',
                fromId: relation.to,
                toId: relation.from,
                delay: relation.delay
            };
        case RelationType.Blocked:
            return {
                uiType: RelationType.Blocks,
                direction: 'reverse',
                fromId: relation.to,
                toId: relation.from,
                delay: relation.delay
            };
        case RelationType.Blocks:
            return {
                uiType: RelationType.Blocks,
                direction: 'forward',
                fromId: relation.from,
                toId: relation.to,
                delay: relation.delay
            };
        case RelationType.Relates:
            return {
                uiType: RelationType.Relates,
                direction: 'forward',
                fromId: relation.from,
                toId: relation.to,
                delay: relation.delay
            };
        case RelationType.Precedes:
        default:
            return {
                uiType: RelationType.Precedes,
                direction: 'forward',
                fromId: relation.from,
                toId: relation.to,
                delay: relation.delay
            };
    }
};

export const toRawRelationType = (uiType: DefaultRelationType, direction: RelationDirection): Relation['type'] => {
    if (uiType === RelationType.Precedes) {
        return direction === 'reverse' ? RelationType.Follows : RelationType.Precedes;
    }

    if (uiType === RelationType.Blocks) {
        return direction === 'reverse' ? RelationType.Blocked : RelationType.Blocks;
    }

    return RelationType.Relates;
};

export const calculateDelay = (
    relationType: string,
    fromTask?: DelayTask,
    toTask?: DelayTask
): { delay?: number; message?: string } => {
    if (!DELAY_ENABLED_RELATIONS.has(relationType)) {
        return {};
    }

    const predecessor = relationType === RelationType.Precedes ? fromTask : toTask;
    const successor = relationType === RelationType.Precedes ? toTask : fromTask;

    if (predecessor?.dueDate === undefined || !Number.isFinite(predecessor.dueDate) ||
        successor?.startDate === undefined || !Number.isFinite(successor.startDate)) {
        return {
            message: i18n.t('label_relation_delay_auto_calc_unavailable') || 'No auto calculation due to missing dates.'
        };
    }

    const nonWorkingWeekDays = getNonWorkingWeekDays();
    const minimumSuccessorStart = addWorkingDays(predecessor.dueDate, 1, nonWorkingWeekDays);
    if (toUtcDayStart(successor.startDate).getTime() < minimumSuccessorStart) {
        return {
            message: i18n.t('label_relation_delay_auto_calc_unavailable') || 'No auto calculation due to missing dates.'
        };
    }

    const delay = countWorkingDaysBetween(predecessor.dueDate, successor.startDate, nonWorkingWeekDays) - 1;
    return { delay };
};

export const validateRelationDelayConsistency = (
    relationType: string,
    delay: number | undefined,
    fromTask?: DelayTask,
    toTask?: DelayTask
): DelayConsistencyResult => {
    if (!DELAY_ENABLED_RELATIONS.has(relationType) || typeof delay !== 'number') {
        return { valid: true };
    }

    const predecessor = relationType === RelationType.Precedes ? fromTask : toTask;
    const successor = relationType === RelationType.Precedes ? toTask : fromTask;
    if (predecessor?.dueDate === undefined || !Number.isFinite(predecessor.dueDate) ||
        successor?.startDate === undefined || !Number.isFinite(successor.startDate)) {
        return { valid: true };
    }

    const nonWorkingWeekDays = getNonWorkingWeekDays();
    const minimumSuccessorStart = addWorkingDays(predecessor.dueDate, 1 + delay, nonWorkingWeekDays);
    if (toUtcDayStart(successor.startDate).getTime() >= minimumSuccessorStart) {
        return { valid: true };
    }

    return {
        valid: false,
        message: i18n.t('label_relation_delay_mismatch') || 'Delay does not match the current task dates.'
    };
};

export const getRelationInfoText = (relationType: DefaultRelationType): string => {
    switch (relationType) {
        case RelationType.Relates:
            return i18n.t('label_relation_type_relates_info') || 'Creates a reference link only. It does not apply any schedule constraint.';
        case RelationType.Blocks:
            return i18n.t('label_relation_type_blocks_info') || 'The source task blocks the target task until the blocking work is finished.';
        case RelationType.Precedes:
        default:
            return i18n.t('label_relation_type_precedes_info') || 'The predecessor task must finish before the successor task starts.';
    }
};

export const getRelationTypeLabel = (relationType: DefaultRelationType): string => {
    switch (relationType) {
        case RelationType.Relates:
            return i18n.t('label_relation_type_relates') || 'Relates';
        case RelationType.Blocks:
            return i18n.t('label_relation_type_blocks') || 'Blocks';
        case RelationType.Precedes:
        default:
            return i18n.t('label_relation_type_precedes') || 'Precedes';
    }
};

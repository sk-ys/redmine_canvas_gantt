import { describe, expect, it, vi } from 'vitest';
import { WorkloadLogicService } from './WorkloadLogicService';
import type { Task } from '../types';

const buildTask = (overrides: Partial<Task>): Task => ({
    id: 'task',
    subject: 'task',
    ratioDone: 0,
    statusId: 1,
    lockVersion: 0,
    editable: true,
    rowIndex: 0,
    hasChildren: false,
    ...overrides
});

describe('WorkloadLogicService', () => {
    it('returns no assignees when every candidate task is filtered out by today-onward mode', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-10T00:00:00Z'));

        const tasks = [
            buildTask({
                id: '1',
                assignedToId: 10,
                assignedToName: 'Alice',
                estimatedHours: 8,
                startDate: Date.UTC(2026, 0, 5),
                dueDate: Date.UTC(2026, 0, 6)
            })
        ];

        const result = WorkloadLogicService.calculateWorkload(tasks, new Set<number>(), {
            capacityThreshold: 8,
            leafIssuesOnly: true,
            includeClosedIssues: false,
            todayOnwardOnly: true
        });

        expect(result.assignees.size).toBe(0);
        expect(result.overloadedAssigneeCount).toBe(0);
        expect(result.overloadedDayCount).toBe(0);

        vi.useRealTimers();
    });
});

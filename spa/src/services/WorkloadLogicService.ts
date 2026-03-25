import type { Task } from '../types';
import { ONE_DAY_MS } from '../constants';

export interface WorkloadOptions {
    capacityThreshold: number; // e.g. 8.0
    leafIssuesOnly: boolean;
    includeClosedIssues: boolean;
    todayOnwardOnly: boolean;
}

export interface DailyWorkload {
    dateStr: string; // YYYY-MM-DD
    timestamp: number;
    totalLoad: number;
    isOverload: boolean;
    contributingTasks: Array<{
        task: Task;
        dailyLoad: number;
    }>;
}

export interface AssigneeWorkload {
    assigneeId: number;
    assigneeName: string;
    dailyWorkloads: Map<string, DailyWorkload>; // Keyed by YYYY-MM-DD
    totalLoad: number;
    peakLoad: number;
}

export interface WorkloadData {
    assignees: Map<number, AssigneeWorkload>; // Keyed by assigneeId
    overloadedAssigneeCount: number;
    overloadedDayCount: number;
}

export class WorkloadLogicService {
    /**
     * Set hours to 00:00:00.000 local time to align dates consistently
     */
    static normalizeDate(timestamp: number): number {
        const d = new Date(timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    /**
     * Format timestamp as YYYY-MM-DD in local time
     */
    static formatDateStr(timestamp: number): string {
        const d = new Date(timestamp);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    static isBusinessDay(timestamp: number): boolean {
        const d = new Date(timestamp);
        const day = d.getDay();
        return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
    }

    static getBusinessDaysInRange(startMs: number, endMs: number): number[] {
        const days: number[] = [];
        let current = this.normalizeDate(startMs);
        const end = this.normalizeDate(endMs);

        while (current <= end) {
            if (this.isBusinessDay(current)) {
                days.push(current);
            }
            current += ONE_DAY_MS;
        }

        return days;
    }

    static calculateWorkload(
        tasks: Task[],
        closedStatusIds: Set<number>,
        options: WorkloadOptions
    ): WorkloadData {
        const assignees = new Map<number, AssigneeWorkload>();
        let overloadedAssigneeCount = 0;
        let overloadedDayCount = 0;
        
        const todayMs = this.normalizeDate(Date.now());

        tasks.forEach(task => {
            // 1. the issue has an assignee
            if (task.assignedToId === undefined || task.assignedToId === null) return;
            // 2. estimated_hours > 0
            if (!task.estimatedHours || task.estimatedHours <= 0) return;
            // 3. valid working range (start_date <= due_date)
            if (!task.startDate || !task.dueDate || task.startDate > task.dueDate) return;
            // 4. leaf-only option
            if (options.leafIssuesOnly && task.hasChildren) return;
            // 5. closed issues option
            if (!options.includeClosedIssues && closedStatusIds.has(task.statusId)) return;

            const businessDays = this.getBusinessDaysInRange(task.startDate, task.dueDate);
            if (businessDays.length === 0) return; // No business days in range

            const dailyLoad = task.estimatedHours / businessDays.length;

            businessDays.forEach(dayMs => {
                if (options.todayOnwardOnly && dayMs < todayMs) return;

                const dateStr = this.formatDateStr(dayMs);
                const assigneeId = task.assignedToId!;
                const assigneeName = task.assignedToName || `Assignee #${assigneeId}`;

                if (!assignees.has(assigneeId)) {
                    assignees.set(assigneeId, {
                        assigneeId,
                        assigneeName,
                        dailyWorkloads: new Map(),
                        totalLoad: 0,
                        peakLoad: 0
                    });
                }

                const workload = assignees.get(assigneeId)!;
                if (!workload.dailyWorkloads.has(dateStr)) {
                    workload.dailyWorkloads.set(dateStr, {
                        dateStr,
                        timestamp: dayMs,
                        totalLoad: 0,
                        isOverload: false,
                        contributingTasks: []
                    });
                }

                const daily = workload.dailyWorkloads.get(dateStr)!;
                daily.totalLoad += dailyLoad;
                daily.contributingTasks.push({ task, dailyLoad });
                workload.totalLoad += dailyLoad;
                
                if (daily.totalLoad > workload.peakLoad) {
                    workload.peakLoad = daily.totalLoad;
                }
            });
        });

        // Second pass: determine overloads and summarize
        assignees.forEach(workload => {
            let assigneeHasOverload = false;
            workload.dailyWorkloads.forEach(daily => {
                if (daily.totalLoad > options.capacityThreshold) {
                    daily.isOverload = true;
                    overloadedDayCount++;
                    assigneeHasOverload = true;
                }
            });
            if (assigneeHasOverload) {
                overloadedAssigneeCount++;
            }
        });

        return {
            assignees,
            overloadedAssigneeCount,
            overloadedDayCount
        };
    }
}

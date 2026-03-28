import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkloadSidebar } from './WorkloadSidebar';
import { useTaskStore } from '../../stores/TaskStore';
import { useWorkloadStore } from '../../stores/WorkloadStore';
import type { WorkloadData } from '../../services/WorkloadLogicService';
import type { Task } from '../../types';
import { useUIStore } from '../../stores/UIStore';

const ONE_DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 0, 5, 12);

const buildTask = (overrides: Partial<Task>): Task => ({
    id: 'task',
    subject: 'task',
    startDate: START,
    dueDate: START,
    ratioDone: 0,
    statusId: 1,
    lockVersion: 0,
    editable: true,
    rowIndex: 0,
    hasChildren: false,
    ...overrides
});

const buildWorkloadData = (): WorkloadData => ({
    assignees: new Map([
        [1, {
            assigneeId: 1,
            assigneeName: 'Alice',
            totalLoad: 16,
            peakLoad: 8,
            dailyWorkloads: new Map([
                ['2026-01-01', {
                    dateStr: '2026-01-01',
                    timestamp: 0,
                    totalLoad: 8,
                    isOverload: false,
                    contributingTasks: []
                }],
                ['2026-01-02', {
                    dateStr: '2026-01-02',
                    timestamp: ONE_DAY,
                    totalLoad: 8,
                    isOverload: false,
                    contributingTasks: []
                }]
            ])
        }]
    ]),
    overloadedAssigneeCount: 0,
    overloadedDayCount: 0
});

const buildOverloadWorkloadData = (): WorkloadData => ({
    assignees: new Map([
        [1, {
            assigneeId: 1,
            assigneeName: 'Alice',
            totalLoad: 31,
            peakLoad: 13,
            dailyWorkloads: new Map([
                ['2026-01-05', {
                    dateStr: '2026-01-05',
                    timestamp: ONE_DAY * 4,
                    totalLoad: 13,
                    isOverload: true,
                    contributingTasks: [
                        {
                            task: buildTask({
                                id: 'task-late',
                                subject: 'Task Late',
                                assignedToId: 1,
                                assignedToName: 'Alice',
                                projectId: 'p1',
                                startDate: START + 4 * ONE_DAY,
                                dueDate: START + 4 * ONE_DAY,
                                estimatedHours: 13
                            }),
                            dailyLoad: 13
                        }
                    ]
                }],
                ['2026-01-02', {
                    dateStr: '2026-01-02',
                    timestamp: ONE_DAY,
                    totalLoad: 11,
                    isOverload: true,
                    contributingTasks: [
                        {
                            task: buildTask({
                                id: 'task-early',
                                subject: 'Task Early',
                                assignedToId: 1,
                                assignedToName: 'Alice',
                                projectId: 'p1',
                                startDate: START + ONE_DAY,
                                dueDate: START + ONE_DAY,
                                estimatedHours: 11
                            }),
                            dailyLoad: 11
                        }
                    ]
                }],
                ['2026-01-04', {
                    dateStr: '2026-01-04',
                    timestamp: ONE_DAY * 3,
                    totalLoad: 7,
                    isOverload: false,
                    contributingTasks: [
                        {
                            task: buildTask({
                                id: 'task-normal',
                                subject: 'Task Normal',
                                assignedToId: 1,
                                assignedToName: 'Alice',
                                projectId: 'p1',
                                startDate: START + 3 * ONE_DAY,
                                dueDate: START + 3 * ONE_DAY,
                                estimatedHours: 7
                            }),
                            dailyLoad: 7
                        }
                    ]
                }]
            ])
        }]
    ]),
    overloadedAssigneeCount: 1,
    overloadedDayCount: 2
});

describe('WorkloadSidebar', () => {
    beforeEach(() => {
        useTaskStore.setState({
            ...useTaskStore.getInitialState(),
            viewport: {
                ...useTaskStore.getInitialState().viewport,
                scrollY: 1200,
                rowHeight: 36
            }
        }, true);
        useUIStore.setState(useUIStore.getInitialState(), true);
        useWorkloadStore.setState(useWorkloadStore.getInitialState(), true);
    });

    it('keeps assignees visible even when the gantt pane is vertically scrolled', () => {
        useWorkloadStore.setState({
            ...useWorkloadStore.getState(),
            workloadData: buildWorkloadData()
        });

        render(<WorkloadSidebar />);

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText(/Peak 8.0h/)).toBeInTheDocument();
    });

    it('stretches to fill the workload pane width', () => {
        useWorkloadStore.setState({
            ...useWorkloadStore.getState(),
            workloadData: buildWorkloadData()
        });

        render(<WorkloadSidebar />);

        expect(screen.getByTestId('workload-sidebar')).toHaveStyle({
            flex: '1 1 0%',
            minWidth: '0',
            width: '100%'
        });
    });

    it('reports vertical scroll changes for workload sync', () => {
        const handleScroll = vi.fn();
        useWorkloadStore.setState({
            ...useWorkloadStore.getState(),
            workloadData: buildWorkloadData()
        });

        render(<WorkloadSidebar onScroll={handleScroll} />);

        const scrollElement = screen.getByTestId('workload-sidebar-scroll');
        Object.defineProperty(scrollElement, 'scrollTop', {
            value: 72,
            configurable: true,
            writable: true
        });

        scrollElement.dispatchEvent(new Event('scroll'));

        expect(handleScroll).toHaveBeenCalledWith(72);
    });

    it('shows an explicit empty state when no workload data matches the current filters', () => {
        useWorkloadStore.setState({
            ...useWorkloadStore.getState(),
            workloadData: {
                assignees: new Map(),
                overloadedAssigneeCount: 0,
                overloadedDayCount: 0
            }
        });

        render(<WorkloadSidebar />);

        expect(screen.getByText('No workload data matches the current filters.')).toBeInTheDocument();
    });

    it('renders overload as a clickable control that cycles the focused histogram bar and focuses the gantt task', () => {
        useWorkloadStore.setState({
            ...useWorkloadStore.getState(),
            workloadData: buildOverloadWorkloadData()
        });
        useTaskStore.getState().setTasks([
            buildTask({
                id: 'task-early',
                subject: 'Task Early',
                assignedToId: 1,
                assignedToName: 'Alice',
                projectId: 'p1',
                startDate: START + ONE_DAY,
                dueDate: START + ONE_DAY,
                estimatedHours: 11
            }),
            buildTask({
                id: 'task-late',
                subject: 'Task Late',
                assignedToId: 1,
                assignedToName: 'Alice',
                projectId: 'p1',
                startDate: START + 4 * ONE_DAY,
                dueDate: START + 4 * ONE_DAY,
                estimatedHours: 13
            })
        ]);

        render(<WorkloadSidebar />);

        const overloadControl = screen.getByRole('button', { name: 'Focus overload histogram for Alice' });
        fireEvent.click(overloadControl);

        expect(useWorkloadStore.getState().focusedHistogramBar).toEqual({ assigneeId: 1, dateStr: '2026-01-02' });
        expect(useTaskStore.getState().selectedTaskId).toBe('task-early');

        fireEvent.click(overloadControl);

        expect(useWorkloadStore.getState().focusedHistogramBar).toEqual({ assigneeId: 1, dateStr: '2026-01-05' });
        expect(useTaskStore.getState().selectedTaskId).toBe('task-late');
    });

    it('shows a warning when overload click targets a task hidden by filters', () => {
        useWorkloadStore.setState({
            ...useWorkloadStore.getState(),
            workloadData: buildOverloadWorkloadData()
        });
        useTaskStore.getState().setTasks([
            buildTask({
                id: 'task-early',
                subject: 'Task Early',
                assignedToId: 1,
                assignedToName: 'Alice',
                projectId: 'p1',
                startDate: START + ONE_DAY,
                dueDate: START + ONE_DAY,
                estimatedHours: 11
            })
        ]);
        useTaskStore.getState().setFilterText('Visible');

        render(<WorkloadSidebar />);

        fireEvent.click(screen.getByRole('button', { name: 'Focus overload histogram for Alice' }));

        expect(useWorkloadStore.getState().focusedHistogramBar).toEqual({ assigneeId: 1, dateStr: '2026-01-02' });
        expect(useTaskStore.getState().selectedTaskId).toBeNull();
        expect(useUIStore.getState().notifications.at(-1)?.message).toBe('Selected task is hidden by the current filters.');
    });
});

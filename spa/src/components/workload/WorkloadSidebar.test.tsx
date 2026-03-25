import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkloadSidebar } from './WorkloadSidebar';
import { useTaskStore } from '../../stores/TaskStore';
import { useWorkloadStore } from '../../stores/WorkloadStore';
import type { WorkloadData } from '../../services/WorkloadLogicService';

const ONE_DAY = 24 * 60 * 60 * 1000;

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
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkloadCanvasPanel } from './WorkloadCanvasPanel';
import { useTaskStore } from '../../stores/TaskStore';
import { useWorkloadStore } from '../../stores/WorkloadStore';
import type { WorkloadData } from '../../services/WorkloadLogicService';

const ONE_DAY = 24 * 60 * 60 * 1000;

const mockContext = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0
} as unknown as CanvasRenderingContext2D;

const buildWorkloadData = (): WorkloadData => ({
    assignees: new Map([
        [1, {
            assigneeId: 1,
            assigneeName: 'Alice',
            totalLoad: 8,
            peakLoad: 8,
            dailyWorkloads: new Map([
                ['2026-01-01', {
                    dateStr: '2026-01-01',
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

beforeEach(() => {
    vi.clearAllMocks();

    class ResizeObserverMock {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
    }
    window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

    useTaskStore.setState({
        ...useTaskStore.getInitialState(),
        viewport: {
            ...useTaskStore.getInitialState().viewport,
            startDate: 1000,
            scrollX: 50,
            scrollY: 60,
            scale: 2,
            height: 200,
            rowHeight: 40
        },
        rowCount: 20
    }, true);

    useWorkloadStore.setState({
        ...useWorkloadStore.getInitialState(),
        workloadData: buildWorkloadData(),
        capacityThreshold: 8
    }, true);
});

describe('WorkloadCanvasPanel', () => {
    it('pans the shared viewport when dragging the histogram area', () => {
        render(<WorkloadCanvasPanel />);

        const viewportElement = screen.getByTestId('workload-canvas-viewport');

        fireEvent.mouseDown(viewportElement, { button: 0, clientX: 100, clientY: 120 });
        fireEvent.mouseMove(window, { clientX: 120, clientY: 150 });
        fireEvent.mouseUp(window);

        const { viewport } = useTaskStore.getState();
        expect(viewport.scrollX).toBe(30);
        expect(viewport.scrollY).toBe(30);
    });

    it('keeps the default cursor before and after dragging the histogram area', () => {
        render(<WorkloadCanvasPanel />);

        const viewportElement = screen.getByTestId('workload-canvas-viewport');
        const canvas = viewportElement.querySelector('canvas');

        expect(canvas).not.toBeNull();
        expect(viewportElement).toHaveStyle({ cursor: 'default' });
        expect(canvas).toHaveStyle({ cursor: 'default' });
        expect(document.body.style.cursor).toBe('');

        fireEvent.mouseDown(viewportElement, { button: 0, clientX: 100, clientY: 120 });
        expect(viewportElement).toHaveStyle({ cursor: 'default' });
        expect(canvas).toHaveStyle({ cursor: 'default' });
        expect(document.body.style.cursor).toBe('');

        fireEvent.mouseUp(window);
        expect(viewportElement).toHaveStyle({ cursor: 'default' });
        expect(canvas).toHaveStyle({ cursor: 'default' });
        expect(document.body.style.cursor).toBe('');
    });

    it('does not start panning from the header area', () => {
        render(<WorkloadCanvasPanel />);

        fireEvent.mouseDown(screen.getByText('HISTOGRAM (DAILY WORKLOAD)'), {
            button: 0,
            clientX: 100,
            clientY: 20
        });
        fireEvent.mouseMove(window, { clientX: 130, clientY: 60 });
        fireEvent.mouseUp(window);

        const { viewport } = useTaskStore.getState();
        expect(viewport.scrollX).toBe(50);
        expect(viewport.scrollY).toBe(60);
    });
});

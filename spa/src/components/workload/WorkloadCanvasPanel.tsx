import React, { useEffect, useRef, useCallback, useLayoutEffect, useState } from 'react';
import { useWorkloadStore } from '../../stores/WorkloadStore';
import { useTaskStore } from '../../stores/TaskStore';
import { useUIStore } from '../../stores/UIStore';
import { WorkloadRenderer } from '../../renderers/WorkloadRenderer';
import { panViewportByPixels } from '../../engines/viewportPan';

interface WorkloadCanvasPanelProps {
    scrollTop?: number;
    onScroll?: (scrollTop: number) => void;
}

export const WorkloadCanvasPanel: React.FC<WorkloadCanvasPanelProps> = ({
    scrollTop = 0,
    onScroll
}) => {
    const HEADER_HEIGHT = 40;
    const DRAG_THRESHOLD_PX = 4;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const renderEngine = useRef<WorkloadRenderer | null>(null);
    const dragStateRef = useRef<{ active: boolean; dragging: boolean; startX: number; startY: number }>({
        active: false,
        dragging: false,
        startX: 0,
        startY: 0
    });
    const [isHistogramBarHovered, setIsHistogramBarHovered] = useState(false);
    const [isPointerSuppressed, setIsPointerSuppressed] = useState(false);
    
    const { workloadData, capacityThreshold } = useWorkloadStore();
    const { viewport, zoomLevel } = useTaskStore();
    const isSidebarResizing = useUIStore((state) => state.isSidebarResizing);
    const rowHeight = viewport.rowHeight * 2;
    const workloadAssigneeCount = workloadData?.assignees.size ?? 0;
    const hasAssignees = workloadAssigneeCount > 0;
    const contentHeight = hasAssignees ? workloadAssigneeCount * rowHeight : 0;
    const cursor = isHistogramBarHovered && !isPointerSuppressed && !isSidebarResizing ? 'pointer' : 'default';

    const updateCanvasSize = useCallback(() => {
        if (!canvasRef.current) return;

        const viewportElement = viewportRef.current;
        const containerElement = containerRef.current;
        if (!viewportElement && !containerElement) return;

        const width = viewportElement?.clientWidth ?? containerElement?.clientWidth ?? 0;
        const height = viewportElement?.clientHeight ?? Math.max(0, (containerElement?.clientHeight ?? 0) - HEADER_HEIGHT);
        if (width > 0 && height > 0) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
        }
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;
        renderEngine.current = new WorkloadRenderer(canvasRef.current);
        
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
            // Trigger render on resize
            if (renderEngine.current) {
               renderEngine.current.render({
                   viewport,
                   zoomLevel,
                   workloadData,
                   capacityThreshold,
                   verticalScroll: scrollTop,
                   hoveredAssigneeId: null,
                   hoveredDateStr: null
               });
            }
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        if (viewportRef.current) {
            resizeObserver.observe(viewportRef.current);
        }
        
        return () => resizeObserver.disconnect();
    }, [capacityThreshold, scrollTop, updateCanvasSize, viewport, zoomLevel, workloadData]);

    useLayoutEffect(() => {
        updateCanvasSize();
    }, [updateCanvasSize]);

    useEffect(() => {
        if (renderEngine.current && canvasRef.current) {
            renderEngine.current.render({
                viewport,
                zoomLevel,
                workloadData,
                capacityThreshold,
                verticalScroll: scrollTop,
                hoveredAssigneeId: null,
                hoveredDateStr: null
            });
        }
    }, [capacityThreshold, scrollTop, viewport, zoomLevel, workloadData]);

    useEffect(() => {
        if (!viewportRef.current) return;
        if (Math.abs(viewportRef.current.scrollTop - scrollTop) > 1) {
            viewportRef.current.scrollTop = scrollTop;
        }
    }, [scrollTop]);

    useEffect(() => {
        const viewportElement = viewportRef.current;
        if (!viewportElement) return;

        const updateHoverState = (clientX: number, clientY: number) => {
            if (isSidebarResizing) {
                if (isHistogramBarHovered) {
                    setIsHistogramBarHovered(false);
                }
                return;
            }

            const viewportRect = viewportElement.getBoundingClientRect();
            const hit = renderEngine.current?.hitTestDailyBar({
                pointerX: clientX - viewportRect.left,
                pointerY: clientY - viewportRect.top,
                viewport,
                zoomLevel,
                workloadData,
                capacityThreshold,
                verticalScroll: scrollTop
            });
            setIsHistogramBarHovered(Boolean(hit));
        };

        const finishDrag = () => {
            if (!dragStateRef.current.active) return;
            dragStateRef.current = {
                active: false,
                dragging: false,
                startX: 0,
                startY: 0
            };
            setIsPointerSuppressed(false);
        };

        const handleMouseDown = (event: MouseEvent) => {
            if (event.button !== 0 || isSidebarResizing) return;
            dragStateRef.current = {
                active: true,
                dragging: false,
                startX: event.clientX,
                startY: event.clientY
            };
            setIsPointerSuppressed(true);
            event.preventDefault();
        };

        const handleViewportMouseMove = (event: MouseEvent) => {
            updateHoverState(event.clientX, event.clientY);
        };

        const handleViewportMouseLeave = () => {
            setIsHistogramBarHovered(false);
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!dragStateRef.current.active) return;
            if (isSidebarResizing) {
                setIsHistogramBarHovered(false);
                finishDrag();
                return;
            }

            const deltaFromStartX = event.clientX - dragStateRef.current.startX;
            const deltaFromStartY = event.clientY - dragStateRef.current.startY;
            if (!dragStateRef.current.dragging) {
                const pointerDistance = Math.hypot(deltaFromStartX, deltaFromStartY);
                if (pointerDistance < DRAG_THRESHOLD_PX) {
                    return;
                }
            }

            const deltaX = event.clientX - dragStateRef.current.startX;
            panViewportByPixels(deltaX, 0);
            dragStateRef.current = {
                active: true,
                dragging: true,
                startX: event.clientX,
                startY: event.clientY
            };
            if (isHistogramBarHovered) {
                setIsHistogramBarHovered(false);
            }
        };

        const handleMouseUp = (event: MouseEvent) => {
            if (!dragStateRef.current.active) return;

            const pointerState = dragStateRef.current;
            finishDrag();

            if (pointerState.dragging || isSidebarResizing) {
                return;
            }

            const viewportRect = viewportElement.getBoundingClientRect();
            const x = event.clientX - viewportRect.left;
            const y = event.clientY - viewportRect.top;
            const hit = renderEngine.current?.hitTestDailyBar({
                pointerX: x,
                pointerY: y,
                viewport,
                zoomLevel,
                workloadData,
                capacityThreshold,
                verticalScroll: scrollTop
            });
            if (!hit) {
                return;
            }

            const { taskId } = useWorkloadStore.getState().resolveNextHistogramTask(hit.assigneeId, hit.dateStr);
            if (!taskId) {
                return;
            }

            const result = useTaskStore.getState().focusTask(taskId);
            if (result.status === 'filtered_out') {
                useUIStore.getState().addNotification('Selected task is hidden by the current filters.', 'warning');
            }

            updateHoverState(event.clientX, event.clientY);
        };

        viewportElement.addEventListener('mousedown', handleMouseDown);
        viewportElement.addEventListener('mousemove', handleViewportMouseMove);
        viewportElement.addEventListener('mouseleave', handleViewportMouseLeave);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            viewportElement.removeEventListener('mousedown', handleMouseDown);
            viewportElement.removeEventListener('mousemove', handleViewportMouseMove);
            viewportElement.removeEventListener('mouseleave', handleViewportMouseLeave);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            finishDrag();
        };
    }, [capacityThreshold, isHistogramBarHovered, isSidebarResizing, scrollTop, viewport, workloadData, zoomLevel]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderTop: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
            <div style={{
                height: '40px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                fontWeight: 600,
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                backgroundColor: '#fafafa'
            }}>
                HISTOGRAM (DAILY WORKLOAD)
            </div>
            <div
                ref={viewportRef}
                data-testid="workload-canvas-viewport"
                onScroll={(event) => onScroll?.(event.currentTarget.scrollTop)}
                style={{
                    position: 'absolute',
                    top: HEADER_HEIGHT,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflowX: 'hidden',
                    overflowY: hasAssignees ? 'auto' : 'hidden',
                    cursor
                }}
            >
                <div style={{ position: 'relative', minHeight: '100%', height: hasAssignees ? `${contentHeight}px` : '100%' }}>
                    <canvas ref={canvasRef} style={{ position: 'sticky', top: 0, display: 'block', cursor }} />
                </div>
                {!hasAssignees && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        cursor: 'default'
                    }}>
                        No workload data matches the current filters.
                    </div>
                )}
            </div>
        </div>
    );
};

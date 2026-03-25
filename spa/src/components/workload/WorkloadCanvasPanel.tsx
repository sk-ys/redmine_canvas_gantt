import React, { useEffect, useRef, useCallback } from 'react';
import { useWorkloadStore } from '../../stores/WorkloadStore';
import { useTaskStore } from '../../stores/TaskStore';
import { useUIStore } from '../../stores/UIStore';
import { WorkloadRenderer } from '../../renderers/WorkloadRenderer';
import { panViewportByPixels } from '../../engines/viewportPan';

export const WorkloadCanvasPanel: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const renderEngine = useRef<WorkloadRenderer | null>(null);
    const dragStateRef = useRef<{ active: boolean; startX: number; startY: number }>({
        active: false,
        startX: 0,
        startY: 0
    });
    
    const { workloadData, capacityThreshold } = useWorkloadStore();
    const { viewport, zoomLevel } = useTaskStore();
    const isSidebarResizing = useUIStore((state) => state.isSidebarResizing);
    const hasAssignees = (workloadData?.assignees.size ?? 0) > 0;

    // Use a fixed or proportion height, but here we just take the parent flex space
    const updateCanvasSize = useCallback(() => {
        if (!containerRef.current || !canvasRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
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
                   hoveredAssigneeId: null,
                   hoveredDateStr: null
               });
            }
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        return () => resizeObserver.disconnect();
    }, [updateCanvasSize, viewport, zoomLevel, workloadData, capacityThreshold]);

    useEffect(() => {
        if (renderEngine.current && canvasRef.current) {
            renderEngine.current.render({
                viewport,
                zoomLevel,
                workloadData,
                capacityThreshold,
                hoveredAssigneeId: null,
                hoveredDateStr: null
            });
        }
    }, [viewport, zoomLevel, workloadData, capacityThreshold]);

    useEffect(() => {
        const viewportElement = viewportRef.current;
        if (!viewportElement) return;

        const finishDrag = () => {
            if (!dragStateRef.current.active) return;
            dragStateRef.current = {
                active: false,
                startX: 0,
                startY: 0
            };
        };

        const handleMouseDown = (event: MouseEvent) => {
            if (event.button !== 0 || isSidebarResizing) return;
            dragStateRef.current = {
                active: true,
                startX: event.clientX,
                startY: event.clientY
            };
            event.preventDefault();
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!dragStateRef.current.active) return;
            if (isSidebarResizing) {
                finishDrag();
                return;
            }

            const deltaX = event.clientX - dragStateRef.current.startX;
            const deltaY = event.clientY - dragStateRef.current.startY;
            panViewportByPixels(deltaX, deltaY);
            dragStateRef.current = {
                active: true,
                startX: event.clientX,
                startY: event.clientY
            };
        };

        viewportElement.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', finishDrag);

        return () => {
            viewportElement.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', finishDrag);
            finishDrag();
        };
    }, [isSidebarResizing]);

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
                style={{
                    position: 'absolute',
                    top: 40,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'hidden',
                    cursor: 'default'
                }}
            >
                <canvas ref={canvasRef} style={{ display: 'block', cursor: 'default' }} />
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

import { useTaskStore } from '../stores/TaskStore';

export function panViewportByPixels(deltaX: number, deltaY: number) {
    const { viewport, updateViewport } = useTaskStore.getState();
    const scale = viewport.scale || 0.00000001;

    let nextScrollX = viewport.scrollX - deltaX;
    let nextStartDate = viewport.startDate;
    if (nextScrollX < 0) {
        nextStartDate = viewport.startDate + (nextScrollX / scale);
        nextScrollX = 0;
    }

    updateViewport({
        startDate: nextStartDate,
        scrollX: nextScrollX,
        scrollY: Math.max(0, viewport.scrollY - deltaY)
    });
}

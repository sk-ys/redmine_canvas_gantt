import { beforeEach, describe, expect, it } from 'vitest';
import { panViewportByPixels } from './viewportPan';
import { useTaskStore } from '../stores/TaskStore';

describe('panViewportByPixels', () => {
    beforeEach(() => {
        useTaskStore.setState({
            ...useTaskStore.getInitialState(),
            viewport: {
                ...useTaskStore.getInitialState().viewport,
                startDate: 1000,
                scrollX: 40,
                scrollY: 80,
                scale: 2,
                height: 200,
                rowHeight: 40
            },
            rowCount: 20
        }, true);
    });

    it('updates scrollX and scrollY using the shared viewport pan rules', () => {
        panViewportByPixels(-10, -20);

        const { viewport } = useTaskStore.getState();
        expect(viewport.startDate).toBe(1000);
        expect(viewport.scrollX).toBe(50);
        expect(viewport.scrollY).toBe(100);
    });

    it('shifts startDate when panning past the left edge', () => {
        panViewportByPixels(60, 0);

        const { viewport } = useTaskStore.getState();
        expect(viewport.scrollX).toBe(0);
        expect(viewport.startDate).toBe(990);
    });
});

import { describe, expect, it } from 'vitest';
import {
    getSidebarAutoScrollMetrics,
    SIDEBAR_AUTO_SCROLL_EDGE_PX,
    SIDEBAR_AUTO_SCROLL_MAX_SPEED,
    SIDEBAR_AUTO_SCROLL_MIN_SPEED
} from './sidebarAutoScroll';

describe('sidebarAutoScroll', () => {
    const rect = { top: 100, bottom: 300 };

    it('returns zero delta outside the edge zones', () => {
        expect(getSidebarAutoScrollMetrics(200, rect)).toEqual({
            topDepth: 0,
            bottomDepth: 0,
            speed: 0,
            delta: 0
        });
    });

    it('returns a negative delta near the top edge', () => {
        const metrics = getSidebarAutoScrollMetrics(95, rect);

        expect(metrics.topDepth).toBeGreaterThan(0);
        expect(metrics.bottomDepth).toBe(0);
        expect(metrics.speed).toBeGreaterThanOrEqual(SIDEBAR_AUTO_SCROLL_MIN_SPEED);
        expect(metrics.speed).toBeLessThanOrEqual(SIDEBAR_AUTO_SCROLL_MAX_SPEED);
        expect(metrics.delta).toBeLessThan(0);
    });

    it('returns a positive delta near the bottom edge', () => {
        const metrics = getSidebarAutoScrollMetrics(295, rect);

        expect(metrics.topDepth).toBe(0);
        expect(metrics.bottomDepth).toBeGreaterThan(0);
        expect(metrics.speed).toBeGreaterThanOrEqual(SIDEBAR_AUTO_SCROLL_MIN_SPEED);
        expect(metrics.speed).toBeLessThanOrEqual(SIDEBAR_AUTO_SCROLL_MAX_SPEED);
        expect(metrics.delta).toBeGreaterThan(0);
    });

    it('hits the max speed at the extreme edge', () => {
        const topMetrics = getSidebarAutoScrollMetrics(rect.top - SIDEBAR_AUTO_SCROLL_EDGE_PX, rect);
        const bottomMetrics = getSidebarAutoScrollMetrics(rect.bottom + SIDEBAR_AUTO_SCROLL_EDGE_PX, rect);

        expect(topMetrics.speed).toBe(SIDEBAR_AUTO_SCROLL_MAX_SPEED);
        expect(topMetrics.delta).toBe(-SIDEBAR_AUTO_SCROLL_MAX_SPEED);
        expect(bottomMetrics.speed).toBe(SIDEBAR_AUTO_SCROLL_MAX_SPEED);
        expect(bottomMetrics.delta).toBe(SIDEBAR_AUTO_SCROLL_MAX_SPEED);
    });
});

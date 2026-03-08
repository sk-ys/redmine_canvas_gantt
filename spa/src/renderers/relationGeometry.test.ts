import { describe, expect, it } from 'vitest';
import { distanceToPolyline, getPolylineMidpoint } from './relationGeometry';

describe('getPolylineMidpoint', () => {
    it('returns the midpoint along the route length', () => {
        expect(getPolylineMidpoint([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 }
        ])).toEqual({ x: 10, y: 0 });
    });
});

describe('distanceToPolyline', () => {
    it('returns a small distance for points close to the route', () => {
        const distance = distanceToPolyline({ x: 5, y: 3 }, [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 }
        ]);

        expect(distance).toBe(3);
    });
});

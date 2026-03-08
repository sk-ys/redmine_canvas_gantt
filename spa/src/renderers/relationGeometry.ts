import { LayoutEngine } from '../engines/LayoutEngine';
import type { Relation, Task, Viewport, ZoomLevel } from '../types';
import { routeDependencyFS, type Point, type Rect, type RouteParams } from './dependencyRouting';

export const RELATION_HIT_TOLERANCE_PX = 10;
export const RELATION_ROUTE_PARAMS: RouteParams = {
    outset: 20,
    inset: 12,
    step: 24,
    maxShift: 8
};

export type RelationRenderContext = {
    taskById: Map<string, Task>;
    rectById: Map<string, Rect>;
    allRects: Array<{ id: string; rect: Rect }>;
};

export const shouldRenderRelationsAtZoom = (zoomLevel: ZoomLevel): boolean => zoomLevel >= 1;

export const buildRelationRenderContext = (
    tasks: Task[],
    viewport: Viewport,
    zoomLevel: ZoomLevel
): RelationRenderContext => {
    const taskById = new Map<string, Task>();
    const rectById = new Map<string, Rect>();
    const allRects: Array<{ id: string; rect: Rect }> = [];

    tasks.forEach((task) => {
        taskById.set(task.id, task);
        const bounds = LayoutEngine.getTaskBounds(task, viewport, 'bar', zoomLevel);
        const rect = {
            x: bounds.x + viewport.scrollX,
            y: bounds.y + viewport.scrollY,
            width: bounds.width,
            height: bounds.height
        };
        rectById.set(task.id, rect);
        allRects.push({ id: task.id, rect });
    });

    return { taskById, rectById, allRects };
};

export const buildRelationRoutePoints = (
    relation: Pick<Relation, 'from' | 'to'>,
    context: RelationRenderContext,
    viewport: Viewport
): Point[] | null => {
    const fromTask = context.taskById.get(relation.from);
    const toTask = context.taskById.get(relation.to);
    if (!fromTask || !toTask) return null;

    if (!Number.isFinite(fromTask.startDate) || !Number.isFinite(fromTask.dueDate) ||
        !Number.isFinite(toTask.startDate) || !Number.isFinite(toTask.dueDate)) {
        return null;
    }

    const fromRect = context.rectById.get(relation.from);
    const toRect = context.rectById.get(relation.to);
    if (!fromRect || !toRect) return null;

    const obstacles = context.allRects
        .filter((entry) => entry.id !== relation.from && entry.id !== relation.to)
        .map((entry) => entry.rect);

    const oneDayMs = 24 * 60 * 60 * 1000;
    return routeDependencyFS(
        fromRect,
        toRect,
        obstacles,
        { scrollY: viewport.scrollY, height: viewport.height },
        {
            rowHeight: viewport.rowHeight,
            fromRowIndex: fromTask.rowIndex,
            toRowIndex: toTask.rowIndex,
            columnWidth: oneDayMs * viewport.scale
        },
        {
            ...RELATION_ROUTE_PARAMS,
            step: viewport.rowHeight
        }
    );
};

export const getPolylineMidpoint = (points: Point[]): Point => {
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];

    let totalLength = 0;
    const segmentLengths: number[] = [];
    for (let i = 0; i < points.length - 1; i += 1) {
        const length = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        segmentLengths.push(length);
        totalLength += length;
    }

    const halfway = totalLength / 2;
    let traversed = 0;
    for (let i = 0; i < segmentLengths.length; i += 1) {
        const length = segmentLengths[i];
        if (traversed + length < halfway) {
            traversed += length;
            continue;
        }

        const start = points[i];
        const end = points[i + 1];
        const ratio = length === 0 ? 0 : (halfway - traversed) / length;
        return {
            x: start.x + (end.x - start.x) * ratio,
            y: start.y + (end.y - start.y) * ratio
        };
    }

    return points[points.length - 1];
};

export const distanceToPolyline = (point: Point, points: Point[]): number => {
    if (points.length < 2) return Infinity;

    let minDistance = Infinity;
    for (let i = 0; i < points.length - 1; i += 1) {
        minDistance = Math.min(minDistance, distanceToSegment(point, points[i], points[i + 1]));
    }
    return minDistance;
};

export const isRouteVisible = (points: Point[], viewport: Viewport): boolean => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    points.forEach((point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    });

    const viewLeft = viewport.scrollX;
    const viewRight = viewport.scrollX + viewport.width;
    const viewTop = viewport.scrollY;
    const viewBottom = viewport.scrollY + viewport.height;

    return !(maxX < viewLeft || minX > viewRight || maxY < viewTop || minY > viewBottom);
};

const distanceToSegment = (point: Point, start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dx === 0 && dy === 0) {
        return Math.hypot(point.x - start.x, point.y - start.y);
    }

    const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, projection));
    const projectedX = start.x + dx * clamped;
    const projectedY = start.y + dy * clamped;
    return Math.hypot(point.x - projectedX, point.y - projectedY);
};

import React from 'react';
import { useUIStore } from '../../stores/UIStore';
import { i18n } from '../../utils/i18n';
import type { MoveTaskAsChildResult, Viewport } from '../../types';
import { getSidebarAutoScrollMetrics } from './sidebarAutoScroll';
import { SIDEBAR_DRAG_EDGE_TOLERANCE } from '../../constants';

type Params = {
    bodyRef: React.RefObject<HTMLDivElement | null>;
    viewportScrollY: number;
    updateViewport: (updates: Partial<Viewport>) => void;
    canDropAsChild: (sourceTaskId: string, targetTaskId: string) => boolean;
    canDropToRoot: (sourceTaskId: string) => boolean;
    moveTaskAsChild: (sourceTaskId: string, targetTaskId: string) => Promise<MoveTaskAsChildResult>;
    moveTaskToRoot: (sourceTaskId: string) => Promise<MoveTaskAsChildResult>;
};

const notifyMoveResult = (result: MoveTaskAsChildResult, successMessage: string) => {
    if (result.status === 'ok') {
        useUIStore.getState().addNotification(successMessage, 'success');
        return;
    }

    if (result.status === 'conflict') {
        useUIStore.getState().addNotification(result.error || i18n.t('label_parent_drop_conflict') || 'Task was updated by another user', 'error');
        return;
    }

    useUIStore.getState().addNotification(result.error || i18n.t('label_parent_drop_failed') || 'Failed to move task', 'error');
};

export const useSidebarDragAndDrop = ({
    bodyRef,
    viewportScrollY,
    updateViewport,
    canDropAsChild,
    canDropToRoot,
    moveTaskAsChild,
    moveTaskToRoot
}: Params) => {
    const [draggingTaskId, setDraggingTaskId] = React.useState<string | null>(null);
    const [dropTargetTaskId, setDropTargetTaskId] = React.useState<string | null>(null);
    const [isRootDropActive, setIsRootDropActive] = React.useState(false);
    const rafIdRef = React.useRef<number | null>(null);
    const latestClientYRef = React.useRef<number | null>(null);
    const previousScrollYRef = React.useRef<number | null>(null);
    const scrollYRef = React.useRef(viewportScrollY);
    const runAutoScrollRef = React.useRef<() => void>(() => undefined);

    React.useEffect(() => {
        scrollYRef.current = viewportScrollY;
    }, [viewportScrollY]);

    const stopAutoScroll = React.useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        latestClientYRef.current = null;
        previousScrollYRef.current = null;
    }, []);

    const runAutoScroll = React.useCallback(() => {
        rafIdRef.current = null;
        const clientY = latestClientYRef.current;
        const bodyElement = bodyRef.current;
        if (clientY === null || !bodyElement) {
            stopAutoScroll();
            return;
        }

        if (previousScrollYRef.current !== null && scrollYRef.current === previousScrollYRef.current) {
            stopAutoScroll();
            return;
        }

        const metrics = getSidebarAutoScrollMetrics(clientY, bodyElement.getBoundingClientRect());
        if (metrics.delta === 0) {
            stopAutoScroll();
            return;
        }

        previousScrollYRef.current = scrollYRef.current;
        updateViewport({ scrollY: scrollYRef.current + metrics.delta });
        rafIdRef.current = requestAnimationFrame(() => {
            runAutoScrollRef.current();
        });
    }, [bodyRef, stopAutoScroll, updateViewport]);

    React.useEffect(() => {
        runAutoScrollRef.current = runAutoScroll;
    }, [runAutoScroll]);

    const updateAutoScrollPointer = React.useCallback((clientY: number) => {
        latestClientYRef.current = clientY;
        const bodyElement = bodyRef.current;
        if (!bodyElement) {
            stopAutoScroll();
            return;
        }

        const metrics = getSidebarAutoScrollMetrics(clientY, bodyElement.getBoundingClientRect());
        if (metrics.delta === 0) {
            stopAutoScroll();
            return;
        }

        if (rafIdRef.current === null) {
            previousScrollYRef.current = null;
            rafIdRef.current = requestAnimationFrame(() => {
                runAutoScrollRef.current();
            });
        }
    }, [bodyRef, stopAutoScroll]);

    React.useEffect(() => stopAutoScroll, [stopAutoScroll]);

    const handleTaskDragStart = React.useCallback((taskId: string, e: React.DragEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.right - e.clientX <= SIDEBAR_DRAG_EDGE_TOLERANCE) {
            e.preventDefault();
            return;
        }

        stopAutoScroll();
        setDraggingTaskId(taskId);
        setDropTargetTaskId(null);
        setIsRootDropActive(false);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
    }, [stopAutoScroll]);

    const handleTaskDragOver = React.useCallback((targetTaskId: string, e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        updateAutoScrollPointer(e.clientY);
        const sourceTaskId = draggingTaskId || e.dataTransfer.getData('text/plain');
        if (!sourceTaskId) return;
        setIsRootDropActive(false);
        if (!canDropAsChild(sourceTaskId, targetTaskId)) {
            e.dataTransfer.dropEffect = 'none';
            if (dropTargetTaskId) setDropTargetTaskId(null);
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dropTargetTaskId !== targetTaskId) {
            setDropTargetTaskId(targetTaskId);
        }
    }, [canDropAsChild, draggingTaskId, dropTargetTaskId, updateAutoScrollPointer]);

    const handleTaskDrop = React.useCallback(async (targetTaskId: string, e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        stopAutoScroll();
        const sourceTaskId = draggingTaskId || e.dataTransfer.getData('text/plain');
        setDropTargetTaskId(null);
        setIsRootDropActive(false);
        setDraggingTaskId(null);
        if (!sourceTaskId || !canDropAsChild(sourceTaskId, targetTaskId)) {
            useUIStore.getState().addNotification(i18n.t('label_parent_drop_invalid_target') || 'Invalid drop target', 'warning');
            return;
        }

        const result = await moveTaskAsChild(sourceTaskId, targetTaskId);
        notifyMoveResult(result, i18n.t('label_parent_drop_success') || 'Task moved as child');
    }, [canDropAsChild, draggingTaskId, moveTaskAsChild, stopAutoScroll]);

    const handleRootDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
        updateAutoScrollPointer(e.clientY);
        const sourceTaskId = draggingTaskId || e.dataTransfer.getData('text/plain');
        if (!sourceTaskId) return;
        if (!canDropToRoot(sourceTaskId)) {
            e.dataTransfer.dropEffect = 'none';
            if (isRootDropActive) setIsRootDropActive(false);
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isRootDropActive) setIsRootDropActive(true);
        if (dropTargetTaskId) setDropTargetTaskId(null);
    }, [canDropToRoot, draggingTaskId, dropTargetTaskId, isRootDropActive, updateAutoScrollPointer]);

    const handleRootDrop = React.useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        stopAutoScroll();
        const sourceTaskId = draggingTaskId || e.dataTransfer.getData('text/plain');
        setDropTargetTaskId(null);
        setIsRootDropActive(false);
        setDraggingTaskId(null);
        if (!sourceTaskId || !canDropToRoot(sourceTaskId)) {
            useUIStore.getState().addNotification(i18n.t('label_parent_drop_invalid_target') || 'Invalid drop target', 'warning');
            return;
        }

        const result = await moveTaskToRoot(sourceTaskId);
        notifyMoveResult(result, i18n.t('label_parent_drop_unset_success') || 'Task parent removed');
    }, [canDropToRoot, draggingTaskId, moveTaskToRoot, stopAutoScroll]);

    const handleBodyDragLeave = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (e.currentTarget !== e.target) return;
        setIsRootDropActive(false);
        stopAutoScroll();
    }, [stopAutoScroll]);

    const resetDragState = React.useCallback(() => {
        stopAutoScroll();
        setDraggingTaskId(null);
        setDropTargetTaskId(null);
        setIsRootDropActive(false);
    }, [stopAutoScroll]);

    return {
        draggingTaskId,
        dropTargetTaskId,
        isRootDropActive,
        setIsRootDropActive,
        handleTaskDragStart,
        handleTaskDragOver,
        handleTaskDrop,
        handleRootDragOver,
        handleRootDrop,
        handleBodyDragLeave,
        resetDragState
    };
};

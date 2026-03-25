import { create } from 'zustand';
import { useTaskStore } from './TaskStore';
import { WorkloadLogicService, type WorkloadData, type WorkloadOptions } from '../services/WorkloadLogicService';
import { loadPreferences, savePreferences } from '../utils/preferences';

interface WorkloadState {
    // Settings
    workloadPaneVisible: boolean;
    capacityThreshold: number;
    leafIssuesOnly: boolean;
    includeClosedIssues: boolean;
    todayOnwardOnly: boolean;

    // Derived Data
    workloadData: WorkloadData | null;

    // Actions
    setWorkloadPaneVisible: (visible: boolean) => void;
    toggleWorkloadPaneVisible: () => void;
    setCapacityThreshold: (threshold: number) => void;
    setLeafIssuesOnly: (leafOnly: boolean) => void;
    setIncludeClosedIssues: (include: boolean) => void;
    setTodayOnwardOnly: (todayOnward: boolean) => void;
    calculateWorkloadData: () => void;
}

const prefs = loadPreferences();

export const useWorkloadStore = create<WorkloadState>((set, get) => ({
    // Initialize from preferences or defaults
    workloadPaneVisible: false,
    capacityThreshold: prefs.capacityThreshold ?? 8.0,
    leafIssuesOnly: prefs.leafIssuesOnly ?? true,
    includeClosedIssues: prefs.includeClosedIssues ?? false,
    todayOnwardOnly: prefs.todayOnwardOnly ?? false,
    
    workloadData: null,

    setWorkloadPaneVisible: (visible) => {
        set({ workloadPaneVisible: visible });
        if (visible) {
            get().calculateWorkloadData();
        }
    },

    toggleWorkloadPaneVisible: () => {
        const nextVisible = !get().workloadPaneVisible;
        set({ workloadPaneVisible: nextVisible });
        if (nextVisible) {
            get().calculateWorkloadData();
        }
    },

    setCapacityThreshold: (threshold) => {
        set({ capacityThreshold: threshold });
        savePreferences({ capacityThreshold: threshold });
        if (get().workloadPaneVisible) {
            get().calculateWorkloadData();
        }
    },

    setLeafIssuesOnly: (leafOnly) => {
        set({ leafIssuesOnly: leafOnly });
        savePreferences({ leafIssuesOnly: leafOnly });
        if (get().workloadPaneVisible) {
            get().calculateWorkloadData();
        }
    },

    setIncludeClosedIssues: (include) => {
        set({ includeClosedIssues: include });
        savePreferences({ includeClosedIssues: include });
        if (get().workloadPaneVisible) {
            get().calculateWorkloadData();
        }
    },

    setTodayOnwardOnly: (todayOnward) => {
        set({ todayOnwardOnly: todayOnward });
        savePreferences({ todayOnwardOnly: todayOnward });
        if (get().workloadPaneVisible) {
            get().calculateWorkloadData();
        }
    },

    calculateWorkloadData: () => {
        const { capacityThreshold, leafIssuesOnly, includeClosedIssues, todayOnwardOnly } = get();
        
        const taskStore = useTaskStore.getState();
        const { allTasks, taskStatuses } = taskStore;

        const closedStatusIds = new Set(
            taskStatuses.filter(s => s.isClosed).map(s => s.id)
        );

        const options: WorkloadOptions = {
            capacityThreshold,
            leafIssuesOnly,
            includeClosedIssues,
            todayOnwardOnly
        };

        const data = WorkloadLogicService.calculateWorkload(allTasks, closedStatusIds, options);
        set({ workloadData: data });
    }
}));

// Subscribe to task store changes so workload updates automatically
useTaskStore.subscribe((state, prevState) => {
    // Basic optimization: Only recalculate if task list or statuses change,
    // and only if workload pane is visible
    if (!useWorkloadStore.getState().workloadPaneVisible) return;

    if (
        state.allTasks !== prevState.allTasks ||
        state.taskStatuses !== prevState.taskStatuses
    ) {
        useWorkloadStore.getState().calculateWorkloadData();
    }
});

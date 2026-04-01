export interface BaselineTaskState {
    issueId: string;
    baselineStartDate: number | null;
    baselineDueDate: number | null;
}

export interface BaselineSnapshot {
    snapshotId: string;
    projectId: string;
    capturedAt: string;
    capturedById?: number | null;
    capturedByName?: string | null;
    tasksByIssueId: Record<string, BaselineTaskState>;
}


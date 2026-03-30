import { useTaskStore } from './TaskStore';
import { replaceIssueQueryParamsInUrl } from '../utils/queryParams';

let previousSerializedState = '';

const syncQueryParams = () => {
    const state = useTaskStore.getState();
    const queryState = {
        queryId: state.activeQueryId ?? undefined,
        selectedStatusIds: state.selectedStatusIds,
        selectedAssigneeIds: state.selectedAssigneeIds,
        selectedProjectIds: state.selectedProjectIds,
        selectedVersionIds: state.selectedVersionIds,
        sortConfig: state.sortConfig,
        groupBy: state.groupByProject ? 'project' : (state.groupByAssignee ? 'assignee' : null),
        showSubprojects: state.showSubprojects
    } as const;

    const serialized = JSON.stringify(queryState);
    if (serialized === previousSerializedState) return;

    previousSerializedState = serialized;
    replaceIssueQueryParamsInUrl(queryState);
};

useTaskStore.subscribe(syncQueryParams);

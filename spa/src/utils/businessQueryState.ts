import type { BusinessQueryState } from '../types';

const CONTROLLED_KEYS = [
    'query_id',
    'status_ids[]',
    'assigned_to_ids[]',
    'project_ids[]',
    'fixed_version_ids[]',
    'group_by',
    'sort',
    'show_subprojects'
];

export const DEFAULT_BUSINESS_QUERY_STATE: BusinessQueryState = {
    queryId: null,
    selectedStatusIds: [],
    selectedAssigneeIds: [],
    selectedProjectIds: [],
    selectedVersionIds: [],
    sortConfig: { key: 'startDate', direction: 'asc' },
    groupByProject: true,
    groupByAssignee: false,
    showSubprojects: true
};

export const buildSearchParamsFromBusinessQueryState = (
    state: BusinessQueryState,
    currentSearch: string = window.location.search
): string => {
    const params = new URLSearchParams(currentSearch);
    CONTROLLED_KEYS.forEach((key) => params.delete(key));

    if (typeof state.queryId === 'number' && state.queryId > 0) {
        params.set('query_id', String(state.queryId));
    }

    state.selectedStatusIds.forEach((id) => params.append('status_ids[]', String(id)));
    state.selectedAssigneeIds.forEach((id) => params.append('assigned_to_ids[]', id === null ? '_none' : String(id)));
    state.selectedProjectIds.forEach((id) => params.append('project_ids[]', id));
    state.selectedVersionIds.forEach((id) => params.append('fixed_version_ids[]', id));

    if (state.groupByAssignee) {
        params.set('group_by', 'assigned_to');
    } else if (state.groupByProject) {
        params.set('group_by', 'project');
    }

    if (state.sortConfig) {
        params.set('sort', `${state.sortConfig.key}:${state.sortConfig.direction}`);
    }

    params.set('show_subprojects', state.showSubprojects ? '1' : '0');

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
};

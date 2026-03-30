import type { BusinessQueryState } from '../types';

export interface ResolvedQueryState {
    queryId?: number | null;
    selectedStatusIds?: number[];
    selectedAssigneeIds?: (number | null)[];
    selectedProjectIds?: string[];
    selectedVersionIds?: string[];
    sortConfig?: BusinessQueryState['sortConfig'];
    groupBy?: 'project' | 'assignee' | null;
    showSubprojects?: boolean;
}

export interface QueryUrlStateSource {
    activeQueryId: number | null;
    selectedStatusIds: number[];
    selectedAssigneeIds: (number | null)[];
    selectedProjectIds: string[];
    selectedVersionIds: string[];
    sortConfig: BusinessQueryState['sortConfig'];
    groupByProject: boolean;
    groupByAssignee: boolean;
    showSubprojects: boolean;
}

const isPersistedQueryId = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value > 0;

const parseIntegerList = (params: URLSearchParams, keys: string[]): number[] | undefined => {
    const values = keys.flatMap((key) => params.getAll(key));
    if (values.length === 0) return undefined;

    return values
        .flatMap((value) => value.split(/[|,]/))
        .map((value) => value.trim())
        .filter((value) => /^-?\d+$/.test(value))
        .map(Number);
};

const parseStringList = (params: URLSearchParams, keys: string[]): string[] | undefined => {
    const values = keys.flatMap((key) => params.getAll(key));
    if (values.length === 0) return undefined;

    return values
        .flatMap((value) => value.split(/[|,]/))
        .map((value) => value.trim())
        .filter(Boolean);
};

const parseAssigneeList = (params: URLSearchParams): (number | null)[] | undefined => {
    const values = parseStringList(params, ['assigned_to_ids[]', 'assigned_to_ids', 'assigned_to_id[]', 'assigned_to_id']);
    if (!values) return undefined;

    return values.flatMap((value) => {
        if (value === '_none' || value === 'none' || value === '!' || value === '!*') return [null];
        return /^-?\d+$/.test(value) ? [Number(value)] : [];
    });
};

const parseVersionList = (params: URLSearchParams): string[] | undefined => {
    const values = parseStringList(params, ['fixed_version_ids[]', 'fixed_version_ids', 'fixed_version_id[]', 'fixed_version_id']);
    if (!values) return undefined;

    return values.flatMap((value) => {
        if (value === '_none' || value === 'none' || value === '!' || value === '!*') return ['_none'];
        return /^-?\d+$/.test(value) ? [value] : [];
    });
};

const CONTROLLED_KEYS = [
    'query_id',
    'status_ids[]',
    'status_ids',
    'status_id[]',
    'status_id',
    'assigned_to_ids[]',
    'assigned_to_ids',
    'assigned_to_id[]',
    'assigned_to_id',
    'project_ids[]',
    'project_ids',
    'fixed_version_ids[]',
    'fixed_version_ids',
    'fixed_version_id[]',
    'fixed_version_id',
    'group_by',
    'sort',
    'show_subprojects'
] as const;

export const toBusinessQueryState = (state: Partial<ResolvedQueryState> = {}): BusinessQueryState => ({
    queryId: state.queryId ?? null,
    selectedStatusIds: state.selectedStatusIds ?? [],
    selectedAssigneeIds: state.selectedAssigneeIds ?? [],
    selectedProjectIds: state.selectedProjectIds ?? [],
    selectedVersionIds: state.selectedVersionIds ?? [],
    sortConfig: state.sortConfig ?? null,
    groupByProject: state.groupBy === 'project',
    groupByAssignee: state.groupBy === 'assignee',
    showSubprojects: state.showSubprojects ?? true
});

export const toResolvedQueryStateFromStore = (state: QueryUrlStateSource): ResolvedQueryState => ({
    queryId: state.activeQueryId ?? undefined,
    selectedStatusIds: state.selectedStatusIds,
    selectedAssigneeIds: state.selectedAssigneeIds,
    selectedProjectIds: state.selectedProjectIds,
    selectedVersionIds: state.selectedVersionIds,
    sortConfig: state.sortConfig ?? undefined,
    groupBy: state.groupByProject ? 'project' : (state.groupByAssignee ? 'assignee' : null),
    showSubprojects: state.showSubprojects
});

export const readIssueQueryParamsFromUrl = (search: string = window.location.search): ResolvedQueryState => {
    const params = new URLSearchParams(search);
    const sort = params.get('sort');
    const [sortKey, sortDirection] = (sort || '').split(':', 2);
    const validDirection = sortDirection === 'desc' ? 'desc' : 'asc';
    const groupBy = params.get('group_by');
    const queryIdRaw = params.get('query_id');
    const parsedQueryId = queryIdRaw && /^-?\d+$/.test(queryIdRaw) ? Number(queryIdRaw) : undefined;

    return {
        queryId: isPersistedQueryId(parsedQueryId) ? parsedQueryId : undefined,
        selectedStatusIds: parseIntegerList(params, ['status_ids[]', 'status_ids', 'status_id[]', 'status_id']),
        selectedAssigneeIds: parseAssigneeList(params),
        selectedProjectIds: parseStringList(params, ['project_ids[]', 'project_ids']),
        selectedVersionIds: parseVersionList(params),
        sortConfig: sortKey ? { key: sortKey, direction: validDirection } : undefined,
        groupBy: groupBy === 'assigned_to' || groupBy === 'assignee' ? 'assignee' : (groupBy === 'project' ? 'project' : null),
        showSubprojects: params.get('show_subprojects') === null ? undefined : params.get('show_subprojects') !== '0'
    };
};

export const buildIssueQueryParams = (state: Partial<ResolvedQueryState>): URLSearchParams => {
    const params = new URLSearchParams();
    const businessState = toBusinessQueryState(state);

    if (isPersistedQueryId(businessState.queryId)) params.set('query_id', String(businessState.queryId));
    businessState.selectedStatusIds.forEach((id) => params.append('status_ids[]', String(id)));
    businessState.selectedAssigneeIds.forEach((id) => params.append('assigned_to_ids[]', id === null ? 'none' : String(id)));
    businessState.selectedProjectIds.forEach((id) => params.append('project_ids[]', id));
    businessState.selectedVersionIds.forEach((id) => params.append('fixed_version_ids[]', id === '_none' ? 'none' : id));
    if (state.groupBy === 'project') params.set('group_by', 'project');
    if (state.groupBy === 'assignee') params.set('group_by', 'assigned_to');
    if (businessState.sortConfig?.key) params.set('sort', `${businessState.sortConfig.key}:${businessState.sortConfig.direction}`);
    if (state.showSubprojects === false) params.set('show_subprojects', '0');

    return params;
};

export const replaceIssueQueryParamsInUrl = (state: ResolvedQueryState): void => {
    const params = new URLSearchParams(window.location.search);
    CONTROLLED_KEYS.forEach((key) => params.delete(key));
    const nextParams = buildIssueQueryParams(state);
    nextParams.forEach((value, key) => params.append(key, value));
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
};

export const parseResolvedQueryState = (value: unknown): ResolvedQueryState | undefined => {
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    const queryId = Number(record.query_id);
    const groupBy = record.group_by === 'project' || record.group_by === 'assignee'
        ? record.group_by
        : (record.group_by_assignee === true
            ? 'assignee'
            : (record.group_by_project === true ? 'project' : null));
    const sortRecord = record.sort_config && typeof record.sort_config === 'object'
        ? record.sort_config as Record<string, unknown>
        : null;

    return {
        queryId: isPersistedQueryId(queryId) ? queryId : undefined,
        selectedStatusIds: Array.isArray(record.selected_status_ids)
            ? record.selected_status_ids.map((entry) => Number(entry)).filter(Number.isFinite)
            : undefined,
        selectedAssigneeIds: Array.isArray(record.selected_assignee_ids)
            ? record.selected_assignee_ids.flatMap((entry) => {
                if (entry === null) return [null];
                const parsed = Number(entry);
                return Number.isFinite(parsed) ? [parsed] : [];
            })
            : undefined,
        selectedProjectIds: Array.isArray(record.selected_project_ids)
            ? record.selected_project_ids.map((entry) => String(entry))
            : undefined,
        selectedVersionIds: Array.isArray(record.selected_version_ids)
            ? record.selected_version_ids.map((entry) => String(entry))
            : undefined,
        sortConfig: sortRecord && sortRecord.key
            ? { key: String(sortRecord.key), direction: sortRecord.direction === 'desc' ? 'desc' : 'asc' }
            : undefined,
        groupBy,
        showSubprojects: typeof record.show_subprojects === 'boolean' ? record.show_subprojects : undefined
    };
};

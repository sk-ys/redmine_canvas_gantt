import { describe, expect, it } from 'vitest';
import {
    parseResolvedQueryState,
    readIssueQueryParamsFromUrl,
    replaceIssueQueryParamsInUrl,
    toBusinessQueryState,
    toResolvedQueryStateFromStore
} from './queryParams';

describe('parseResolvedQueryState', () => {
    it('accepts backend boolean grouping payload', () => {
        const parsed = parseResolvedQueryState({
            query_id: 42,
            selected_status_ids: [1, 2],
            selected_assignee_ids: [7, null],
            selected_project_ids: ['1'],
            selected_version_ids: ['2'],
            sort_config: { key: 'subject', direction: 'desc' },
            group_by_assignee: true,
            show_subprojects: false
        });

        expect(parsed).toEqual({
            queryId: 42,
            selectedStatusIds: [1, 2],
            selectedAssigneeIds: [7, null],
            selectedProjectIds: ['1'],
            selectedVersionIds: ['2'],
            sortConfig: { key: 'subject', direction: 'desc' },
            groupBy: 'assignee',
            showSubprojects: false
        });
    });

    it('drops non-persisted query ids from backend payload', () => {
        const parsed = parseResolvedQueryState({
            query_id: 0,
            selected_status_ids: [1]
        });

        expect(parsed).toEqual({
            selectedStatusIds: [1],
            groupBy: null
        });
    });
});

describe('readIssueQueryParamsFromUrl', () => {
    it('ignores query_id=0 in the browser URL', () => {
        expect(readIssueQueryParamsFromUrl('?query_id=0&status_ids[]=1')).toEqual({
            queryId: undefined,
            selectedStatusIds: [1],
            selectedAssigneeIds: undefined,
            selectedProjectIds: undefined,
            selectedVersionIds: undefined,
            sortConfig: undefined,
            groupBy: null,
            showSubprojects: undefined
        });
    });
});

describe('toResolvedQueryStateFromStore', () => {
    it('normalizes store state into query payload shape', () => {
        expect(toResolvedQueryStateFromStore({
            activeQueryId: 9,
            selectedStatusIds: [1, 2],
            selectedAssigneeIds: [7, null],
            selectedProjectIds: ['3'],
            selectedVersionIds: ['4'],
            sortConfig: { key: 'subject', direction: 'asc' },
            groupByProject: false,
            groupByAssignee: true,
            showSubprojects: false
        })).toEqual({
            queryId: 9,
            selectedStatusIds: [1, 2],
            selectedAssigneeIds: [7, null],
            selectedProjectIds: ['3'],
            selectedVersionIds: ['4'],
            sortConfig: { key: 'subject', direction: 'asc' },
            groupBy: 'assignee',
            showSubprojects: false
        });
    });
});

describe('toBusinessQueryState', () => {
    it('fills defaults when resolved query state is partial', () => {
        expect(toBusinessQueryState({
            queryId: 11,
            selectedStatusIds: [1],
            groupBy: 'project'
        })).toEqual({
            queryId: 11,
            selectedStatusIds: [1],
            selectedAssigneeIds: [],
            selectedProjectIds: [],
            selectedVersionIds: [],
            sortConfig: null,
            groupByProject: true,
            groupByAssignee: false,
            showSubprojects: true
        });
    });
});

describe('replaceIssueQueryParamsInUrl', () => {
    it('rewrites only known shared query params', () => {
        window.history.replaceState({}, '', '/projects/demo/canvas_gantt?query_id=9&foo=bar');

        replaceIssueQueryParamsInUrl({
            queryId: 42,
            selectedStatusIds: [1, 2],
            selectedAssigneeIds: [7],
            selectedProjectIds: ['3'],
            selectedVersionIds: ['4'],
            sortConfig: { key: 'subject', direction: 'asc' },
            groupBy: 'project',
            showSubprojects: false
        });

        const url = new URL(window.location.href);
        expect(url.searchParams.get('foo')).toBe('bar');
        expect(url.searchParams.get('query_id')).toBe('42');
        expect(url.searchParams.getAll('status_ids[]')).toEqual(['1', '2']);
        expect(url.searchParams.getAll('assigned_to_ids[]')).toEqual(['7']);
        expect(url.searchParams.getAll('project_ids[]')).toEqual(['3']);
        expect(url.searchParams.getAll('fixed_version_ids[]')).toEqual(['4']);
        expect(url.searchParams.get('group_by')).toBe('project');
        expect(url.searchParams.get('sort')).toBe('subject:asc');
        expect(url.searchParams.get('show_subprojects')).toBe('0');
    });

    it('removes query_id when it is not a persisted query id', () => {
        window.history.replaceState({}, '', '/projects/demo/canvas_gantt?query_id=0&foo=bar');

        replaceIssueQueryParamsInUrl({
            queryId: 0,
            selectedStatusIds: []
        });

        const url = new URL(window.location.href);
        expect(url.searchParams.get('foo')).toBe('bar');
        expect(url.searchParams.get('query_id')).toBeNull();
    });
});

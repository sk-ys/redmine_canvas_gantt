import type { SidebarColumnDefinition } from './sidebarColumnSettings';

export type ColumnMeta = SidebarColumnDefinition & {
    defaultVisible: boolean;
    movable: boolean;
};

export const COLUMN_CATALOG: ColumnMeta[] = [
    { key: 'id', label: 'ID', defaultVisible: true, movable: true },
    { key: 'subject', label: 'Task Name', defaultVisible: true, movable: true },
    { key: 'notification', label: 'Notifications', defaultVisible: true, movable: true },
    { key: 'project', label: 'Project', defaultVisible: false, movable: true },
    { key: 'tracker', label: 'Tracker', defaultVisible: false, movable: true },
    { key: 'status', label: 'Status', defaultVisible: true, movable: true },
    { key: 'priority', label: 'Priority', defaultVisible: false, movable: true },
    { key: 'assignee', label: 'Assignee', defaultVisible: true, movable: true },
    { key: 'author', label: 'Author', defaultVisible: false, movable: true },
    { key: 'startDate', label: 'Start Date', defaultVisible: true, movable: true },
    { key: 'dueDate', label: 'Due Date', defaultVisible: true, movable: true },
    { key: 'estimatedHours', label: 'Estimated Time', defaultVisible: false, movable: true },
    { key: 'ratioDone', label: 'Progress', defaultVisible: true, movable: true },
    { key: 'spentHours', label: 'Spent Time', defaultVisible: false, movable: true },
    { key: 'version', label: 'Target Version', defaultVisible: false, movable: true },
    { key: 'category', label: 'Category', defaultVisible: false, movable: true },
    { key: 'createdOn', label: 'Created', defaultVisible: false, movable: true },
    { key: 'updatedOn', label: 'Updated', defaultVisible: false, movable: true }
];

export const getColumnDefinitions = (): SidebarColumnDefinition[] =>
    COLUMN_CATALOG.map(({ key, label }) => ({ key, label }));

export const getDefaultVisibleColumnKeys = (): string[] =>
    COLUMN_CATALOG.filter((column) => column.defaultVisible).map((column) => column.key);

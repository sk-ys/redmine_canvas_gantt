import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GanttToolbar } from './GanttToolbar';
import { useTaskStore } from '../stores/TaskStore';
import { useUIStore, getInitialRelationSettings } from '../stores/UIStore';
import '../stores/preferencesWatcher';
import { RelationType } from '../types/constraints';

describe('GanttToolbar shortcuts', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.RedmineCanvasGantt = {
            ...(window.RedmineCanvasGantt ?? {
                projectId: 1,
                apiBase: '',
                redmineBase: '',
                authToken: '',
                apiKey: '',
                nonWorkingWeekDays: [],
                i18n: {}
            }),
            settings: {
                ...(window.RedmineCanvasGantt?.settings ?? {}),
                default_relation_type: RelationType.Precedes,
                auto_calculate_delay: '1',
                dependency_edit_mode: '1'
            }
        };
        useTaskStore.setState(useTaskStore.getInitialState(), true);
        useUIStore.setState(useUIStore.getInitialState(), true);
    });

    it('opens filter input with Ctrl+F and cancels with Escape', async () => {
        useTaskStore.setState({
            filterText: '',
            allTasks: [],
            versions: [],
            selectedAssigneeIds: [],
            selectedProjectIds: [],
            selectedVersionIds: [],
            taskStatuses: [],
            selectedStatusIds: [],
            modifiedTaskIds: new Set(),
            autoSave: true
        });

        render(<GanttToolbar zoomLevel={1} onZoomChange={() => {}} />);

        fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

        const filterInput = await screen.findByPlaceholderText(/filter by subject/i);
        await waitFor(() => {
            expect(document.activeElement).toBe(filterInput);
        });

        fireEvent.change(filterInput, { target: { value: 'abc' } });
        expect(useTaskStore.getState().filterText).toBe('abc');

        fireEvent.keyDown(window, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByPlaceholderText(/filter by subject/i)).not.toBeInTheDocument();
            expect(useTaskStore.getState().filterText).toBe('');
        });
    });

    it('toggles left and right pane maximization buttons', () => {
        useTaskStore.setState({
            filterText: '',
            allTasks: [],
            versions: [],
            selectedAssigneeIds: [],
            selectedProjectIds: [],
            selectedVersionIds: [],
            taskStatuses: [],
            selectedStatusIds: [],
            modifiedTaskIds: new Set(),
            autoSave: true
        });

        render(<GanttToolbar zoomLevel={1} onZoomChange={() => {}} />);

        const leftMaxButton = screen.getByTestId('maximize-left-pane-button');
        const rightMaxButton = screen.getByTestId('maximize-right-pane-button');

        fireEvent.click(leftMaxButton);
        expect(useUIStore.getState().leftPaneVisible).toBe(true);
        expect(useUIStore.getState().rightPaneVisible).toBe(false);

        fireEvent.click(rightMaxButton);
        expect(useUIStore.getState().leftPaneVisible).toBe(false);
        expect(useUIStore.getState().rightPaneVisible).toBe(true);

        fireEvent.click(rightMaxButton);
        expect(useUIStore.getState().leftPaneVisible).toBe(true);
        expect(useUIStore.getState().rightPaneVisible).toBe(true);
    });


    it('toggles dependency edit mode button state', () => {
        useTaskStore.setState({
            filterText: '',
            allTasks: [],
            versions: [],
            selectedAssigneeIds: [],
            selectedProjectIds: [],
            selectedVersionIds: [],
            taskStatuses: [],
            selectedStatusIds: [],
            modifiedTaskIds: new Set(),
            autoSave: true
        });

        render(<GanttToolbar zoomLevel={1} onZoomChange={() => {}} />);
        const button = screen.getByTestId('dependency-edit-mode-button');
        const initial = useUIStore.getState().dependencyEditMode;
        fireEvent.click(button);
        expect(useUIStore.getState().dependencyEditMode).toBe(!initial);
    });

    it('updates row height via checkbox list menu and keeps it open', () => {
        useTaskStore.setState({
            filterText: '',
            allTasks: [],
            versions: [],
            selectedAssigneeIds: [],
            selectedProjectIds: [],
            selectedVersionIds: [],
            taskStatuses: [],
            selectedStatusIds: [],
            modifiedTaskIds: new Set(),
            autoSave: true,
            viewport: {
                ...useTaskStore.getState().viewport,
                rowHeight: 36
            }
        });

        render(<GanttToolbar zoomLevel={1} onZoomChange={() => {}} />);

        const rowHeightButton = screen.getByTestId('row-height-menu-button');
        expect(rowHeightButton).toHaveTextContent('M');

        fireEvent.click(rowHeightButton);
        expect(screen.getByTestId('row-height-menu')).toBeInTheDocument();
        expect(screen.getByLabelText('M')).toBeChecked();

        fireEvent.click(screen.getByLabelText('XL'));
        expect(useTaskStore.getState().viewport.rowHeight).toBe(52);
        expect(screen.getByTestId('row-height-menu')).toBeInTheDocument();
        expect(screen.getByLabelText('XL')).toBeChecked();
        expect(screen.getByTestId('row-height-menu-button')).toHaveTextContent('XL');

        fireEvent.click(screen.getByLabelText('S'));
        expect(useTaskStore.getState().viewport.rowHeight).toBe(28);
        expect(screen.getByTestId('row-height-menu')).toBeInTheDocument();
        expect(screen.getByLabelText('S')).toBeChecked();
        expect(screen.getByTestId('row-height-menu-button')).toHaveTextContent('S');

        fireEvent.click(rowHeightButton);
        expect(screen.queryByTestId('row-height-menu')).not.toBeInTheDocument();

        fireEvent.click(rowHeightButton);
        expect(screen.getByTestId('row-height-menu')).toBeInTheDocument();

        fireEvent.mouseDown(document.body);
        expect(screen.queryByTestId('row-height-menu')).not.toBeInTheDocument();
    });

    it('updates relation settings via header menu and restores them from preferences', () => {
        useTaskStore.setState({
            filterText: '',
            allTasks: [],
            versions: [],
            selectedAssigneeIds: [],
            selectedProjectIds: [],
            selectedVersionIds: [],
            taskStatuses: [],
            selectedStatusIds: [],
            modifiedTaskIds: new Set(),
            autoSave: true
        });

        const { unmount } = render(<GanttToolbar zoomLevel={1} onZoomChange={() => {}} />);

        fireEvent.click(screen.getByTestId('relation-settings-menu-button'));
        expect(screen.getByTestId('relation-settings-menu')).toBeInTheDocument();
        expect(screen.getByLabelText(RelationType.Precedes)).toBeChecked();
        expect(screen.getByTestId('auto-calculate-delay-toggle')).toBeChecked();

        fireEvent.click(screen.getByLabelText(RelationType.Blocks));
        expect(useUIStore.getState().defaultRelationType).toBe(RelationType.Blocks);
        expect(screen.getByTestId('relation-settings-menu')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('auto-calculate-delay-toggle'));
        expect(useUIStore.getState().autoCalculateDelay).toBe(false);
        expect(screen.getByTestId('relation-settings-menu')).toBeInTheDocument();

        unmount();

        useUIStore.setState({
            ...useUIStore.getState(),
            ...getInitialRelationSettings()
        });

        render(<GanttToolbar zoomLevel={1} onZoomChange={() => {}} />);
        fireEvent.click(screen.getByTestId('relation-settings-menu-button'));

        expect(screen.getByLabelText(RelationType.Blocks)).toBeChecked();
        expect(screen.getByTestId('auto-calculate-delay-toggle')).not.toBeChecked();
    });
});

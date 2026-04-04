import { useBaselineStore } from '../stores/BaselineStore';
import { useTaskStore } from '../stores/TaskStore';
import { useUIStore } from '../stores/UIStore';

export const resetCanvasGanttTestState = () => {
    window.localStorage.clear();
    window.RedmineCanvasGantt = {
        projectId: 1,
        projectPath: '/projects/ecookbook',
        issueListPath: '/projects/ecookbook/issues',
        newIssuePath: '/projects/ecookbook/issues/new',
        canvasGanttPath: '/projects/ecookbook/canvas_gantt',
        apiBase: '',
        redmineBase: '',
        authToken: '',
        apiKey: '',
        nonWorkingWeekDays: [],
        i18n: {},
        settings: {
            ...(window.RedmineCanvasGantt?.settings ?? {})
        }
    };

    useTaskStore.setState(useTaskStore.getInitialState(), true);
    useUIStore.setState(useUIStore.getInitialState(), true);
    useBaselineStore.setState(useBaselineStore.getInitialState(), true);
};

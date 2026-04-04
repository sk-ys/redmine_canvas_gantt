import type { ResolvedQueryState } from './queryParams';
import { normalizeResolvedQueryState } from './queryParams';

type SharedQueryEnvelopeV1 = {
    version: 1;
    projects: Record<string, ResolvedQueryState>;
};

const STORAGE_KEY = 'canvasGantt:lastSharedQueryState';
const STORAGE_VERSION = 1;
const GLOBAL_PROJECT_KEY = 'project:global';

const isBrowser = typeof window !== 'undefined';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isResolvedQueryStateRecord = (value: unknown): value is ResolvedQueryState =>
    isRecord(value);

const isEnvelope = (value: unknown): value is SharedQueryEnvelopeV1 => {
    if (!isRecord(value)) return false;
    if (value.version !== STORAGE_VERSION) return false;
    if (!isRecord(value.projects)) return false;
    return Object.values(value.projects).every((entry) => isResolvedQueryStateRecord(entry));
};

const resolveProjectKey = (projectId?: string | number | null): string => {
    const id = projectId ?? window.RedmineCanvasGantt?.projectId;
    if (id === undefined || id === null || String(id) === '') return GLOBAL_PROJECT_KEY;
    return `project:${String(id)}`;
};

const persistEnvelope = (envelope: SharedQueryEnvelopeV1) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
};

const loadEnvelope = (): SharedQueryEnvelopeV1 | null => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as unknown;
        return isEnvelope(parsed) ? parsed : null;
    } catch (error) {
        console.warn('Failed to parse stored shared query state', error);
        return null;
    }
};

export const loadLastUsedSharedQueryState = (projectId?: string | number | null): ResolvedQueryState | undefined => {
    if (!isBrowser) return undefined;

    const envelope = loadEnvelope();
    if (!envelope) return undefined;

    return normalizeResolvedQueryState(envelope.projects[resolveProjectKey(projectId)]);
};

export const saveLastUsedSharedQueryState = (
    state: Partial<ResolvedQueryState>,
    projectId?: string | number | null
) => {
    if (!isBrowser) return;

    const projectKey = resolveProjectKey(projectId);
    const normalized = normalizeResolvedQueryState(state);
    const envelope = loadEnvelope() ?? { version: STORAGE_VERSION, projects: {} };

    if (!normalized) {
        if (!envelope.projects[projectKey]) return;
        const rest = { ...envelope.projects };
        delete rest[projectKey];
        persistEnvelope({ version: STORAGE_VERSION, projects: rest });
        return;
    }

    persistEnvelope({
        version: STORAGE_VERSION,
        projects: {
            ...envelope.projects,
            [projectKey]: normalized
        }
    });
};

export const clearLastUsedSharedQueryState = (projectId?: string | number | null) => {
    if (!isBrowser) return;

    const projectKey = resolveProjectKey(projectId);
    const envelope = loadEnvelope();
    if (!envelope?.projects[projectKey]) return;

    const rest = { ...envelope.projects };
    delete rest[projectKey];
    persistEnvelope({ version: STORAGE_VERSION, projects: rest });
};

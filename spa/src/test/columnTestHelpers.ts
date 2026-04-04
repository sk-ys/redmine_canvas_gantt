import { buildColumnSettingsFromVisibleKeys } from '../components/sidebar/sidebarColumnSettings';
import { getColumnDefinitions } from '../components/sidebar/sidebarColumnCatalog';

export const setVisibleColumnsForTest = (visibleKeys: string[]) => {
    const definitions = getColumnDefinitions();
    const columnSettings = buildColumnSettingsFromVisibleKeys(definitions, visibleKeys);

    return { definitions, columnSettings };
};

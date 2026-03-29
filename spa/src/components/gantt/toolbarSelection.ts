export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';

export const toggleSelectionValue = <T,>(selectedValues: T[], value: T): T[] =>
    selectedValues.includes(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value];

export const toggleAllSelectionValues = <T,>(isAllSelected: boolean, allValues: T[]): T[] =>
    isAllSelected ? [] : allValues;

export const dedupeNumbers = (values: number[]): number[] => Array.from(new Set(values));

export const mergeStatusSelection = (selectedIds: number[], groupIds: number[], shouldSelect: boolean): number[] => {
    if (shouldSelect) return dedupeNumbers([...selectedIds, ...groupIds]);
    const groupIdSet = new Set(groupIds);
    return selectedIds.filter((id) => !groupIdSet.has(id));
};

export const resolveCheckboxState = (groupIds: number[], selectedIds: number[]): CheckboxState => {
    if (groupIds.length === 0) return 'unchecked';
    const selectedGroupCount = groupIds.filter((id) => selectedIds.includes(id)).length;
    if (selectedGroupCount === 0) return 'unchecked';
    if (selectedGroupCount === groupIds.length) return 'checked';
    return 'indeterminate';
};

export const applyIndeterminateState = (element: HTMLInputElement | null, state: CheckboxState) => {
    if (!element) return;
    element.indeterminate = state === 'indeterminate';
};

export const isCheckboxChecked = (state: CheckboxState): boolean => state === 'checked';

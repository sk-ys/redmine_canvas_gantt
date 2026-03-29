import { describe, expect, it } from 'vitest';
import {
    applyIndeterminateState,
    isCheckboxChecked,
    mergeStatusSelection,
    resolveCheckboxState,
    toggleAllSelectionValues,
    toggleSelectionValue,
} from './toolbarSelection';

describe('toolbarSelection helpers', () => {
    it('toggles values without mutating the original array', () => {
        const source = [1, 2];
        const next = toggleSelectionValue(source, 3);

        expect(next).toEqual([1, 2, 3]);
        expect(source).toEqual([1, 2]);
    });

    it('resolves checkbox state and indeterminate DOM state', () => {
        expect(resolveCheckboxState([1, 2], [])).toBe('unchecked');
        expect(resolveCheckboxState([1, 2], [1])).toBe('indeterminate');
        expect(resolveCheckboxState([1, 2], [1, 2])).toBe('checked');
        expect(isCheckboxChecked('checked')).toBe(true);

        const element = document.createElement('input');
        applyIndeterminateState(element, 'indeterminate');
        expect(element.indeterminate).toBe(true);
    });

    it('merges and clears selection groups', () => {
        expect(toggleAllSelectionValues(true, [1, 2])).toEqual([]);
        expect(toggleAllSelectionValues(false, [1, 2])).toEqual([1, 2]);
        expect(mergeStatusSelection([1, 2, 3], [2, 3], true)).toEqual([1, 2, 3]);
        expect(mergeStatusSelection([1, 2, 3], [2, 3], false)).toEqual([1]);
    });
});

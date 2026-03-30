import { buildRedmineUrl } from './redmineUrl';

export const navigateToRedminePath = (path: string): void => {
    window.location.assign(buildRedmineUrl(path));
};

import { expect, test } from '@playwright/test';
import { adminLogin } from './helpers';

const ensureCanvasGanttModuleEnabled = async (redmineBase: string, page: import('@playwright/test').Page) => {
  await page.goto(`${redmineBase}/projects/ecookbook/settings/modules`);

  const moduleToggle = page.getByLabel('Canvas Gantt');
  await expect(moduleToggle).toBeVisible();

  if (!(await moduleToggle.isChecked())) {
    await moduleToggle.check();
    await page.getByRole('button', { name: /save|apply/i }).click();
  }
};

test('preserves issue list filters when opening Canvas Gantt', async ({ page, baseURL }) => {
  const redmineBase = baseURL ?? 'http://127.0.0.1:3000';
  const issueListUrl = new URL(`${redmineBase}/projects/ecookbook/issues`);
  issueListUrl.searchParams.set('set_filter', '1');
  issueListUrl.searchParams.append('f[]', 'status_id');
  issueListUrl.searchParams.set('op[status_id]', 'o');
  issueListUrl.searchParams.set('sort', 'start_date:desc');
  issueListUrl.searchParams.set('group_by', 'assigned_to');
  issueListUrl.searchParams.set('show_subprojects', '0');

  await adminLogin(redmineBase, page);
  await ensureCanvasGanttModuleEnabled(redmineBase, page);
  await page.goto(issueListUrl.toString());

  const inlineLink = page.locator('#canvas-gantt-query-action-link');
  await expect(inlineLink).toBeVisible();

  const inlineHref = await inlineLink.getAttribute('href');
  expect(inlineHref).not.toBeNull();
  expect(inlineHref).toContain('/projects/ecookbook/canvas_gantt?');
  expect(inlineHref).toContain('set_filter=1');
  expect(inlineHref).toContain('f%5B%5D=status_id');
  expect(inlineHref).toContain('op%5Bstatus_id%5D=o');
  expect(inlineHref).toContain('sort=start_date%3Adesc');
  expect(inlineHref).toContain('group_by=assigned_to');
  expect(inlineHref).toContain('show_subprojects=0');

  const menuLink = page.locator('a.menu-canvas-gantt, #main-menu a[href*="/canvas_gantt"], #project-menu a[href*="/canvas_gantt"]').first();
  await expect(menuLink).toBeVisible();
  await expect(menuLink).toHaveAttribute('href', new RegExp('set_filter=1'));
  await expect(menuLink).toHaveAttribute('href', new RegExp('group_by=assigned_to'));

  await menuLink.click();
  await expect(page.locator('#redmine-canvas-gantt-root')).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/ecookbook\/canvas_gantt\?/);
  await expect(page).toHaveURL(/set_filter=1/);
  await expect(page).toHaveURL(/group_by=assigned_to/);
  await expect(page).toHaveURL(/show_subprojects=0/);
});

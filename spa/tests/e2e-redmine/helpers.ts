import { type Page } from '@playwright/test';

export const adminLogin = async (baseURL: string, page: Page) => {
  await page.goto(`${baseURL}/login`);
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('admin');
  await page.getByRole('button', { name: /login|sign in/i }).click();

  const passwordChangeField = page.locator('#new_password');
  if (await passwordChangeField.isVisible().catch(() => false)) {
    await passwordChangeField.fill('admin');
    await page.locator('#new_password_confirmation').fill('admin');
    await page.getByRole('button', { name: /apply|save/i }).click();
  }
};

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigates to Dashboard by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.board')).toBeVisible();
  });

  test('navigates to My Tasks via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.sidebar__nav-item', { hasText: 'MY TASK' }).click();
    await expect(page).toHaveURL('/my-tasks');
    await expect(page.locator('.task-table')).toBeVisible();
  });

  test('navigates back to Dashboard via sidebar', async ({ page }) => {
    await page.goto('/my-tasks');
    await page.locator('.sidebar__nav-item', { hasText: 'DASHBOARD' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.board')).toBeVisible();
  });

  test('navigates to Settings via URL', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('.settings__title')).toHaveText('Settings');
  });

  test('shows 404 for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.locator('.not-found__code')).toHaveText('404');
  });

  test('view toggle switches between board and list views', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.board')).toBeVisible();

    // Click list view toggle
    await page.locator('.toolbar__view-btn[aria-label="List view"]').click();
    await expect(page).toHaveURL('/my-tasks');
    await expect(page.locator('.task-table')).toBeVisible();

    // Click grid view toggle
    await page.locator('.toolbar__view-btn[aria-label="Grid view"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.board')).toBeVisible();
  });
});

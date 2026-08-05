import { test, expect } from '@playwright/test';

test.describe('My Tasks (List View)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-tasks');
    await page.waitForSelector('.task-table__row', { timeout: 10000 });
  });

  test('displays the table with column headers', async ({ page }) => {
    const header = page.locator('.task-table__header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Task Name');
    await expect(header).toContainText('Task Tags');
    await expect(header).toContainText('Estimate');
  });

  test('shows task sections grouped by status', async ({ page }) => {
    const sections = page.locator('.task-table__section');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sections are collapsible', async ({ page }) => {
    const firstSection = page.locator('.task-table__section-header').first();
    const firstRow = page.locator('.task-table__section').first().locator('.task-table__row').first();

    // Initially visible
    await expect(firstRow).toBeVisible();

    // Click to collapse
    await firstSection.click();
    await expect(firstRow).not.toBeVisible();

    // Click again to expand
    await firstSection.click();
    await expect(firstRow).toBeVisible();
  });

  test('clicking a task row opens the edit modal', async ({ page }) => {
    // Click on the task name area to avoid hitting the tag popup button
    const taskName = page.locator('.task-table__row-task-name').first();
    await taskName.click();
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.task-form__title-input')).toBeVisible();
  });

  test('tag overflow shows +N popup on click', async ({ page }) => {
    // Find a row that has the +N badge
    const tagMore = page.locator('.task-table__tag-more').first();
    const hasTagMore = await tagMore.count();

    if (hasTagMore > 0) {
      await tagMore.click();
      await expect(page.locator('.task-table__tag-popup')).toBeVisible();

      // Click again to close
      await tagMore.click();
      await expect(page.locator('.task-table__tag-popup')).not.toBeVisible();
    }
  });

  test('has the search filter panel', async ({ page }) => {
    await page.locator('.search-filter__toggle').click();
    await expect(page.locator('.search-filter__panel')).toBeVisible();
  });
});

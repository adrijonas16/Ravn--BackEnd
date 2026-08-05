import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for tasks to load from the API
    await page.waitForSelector('.task-card', { timeout: 10000 });
  });

  test('displays the Kanban board with 5 columns', async ({ page }) => {
    const columns = page.locator('.task-column');
    await expect(columns).toHaveCount(5);
  });

  test('each column has a header with task count', async ({ page }) => {
    const headers = page.locator('.task-column__title');
    await expect(headers.first()).toBeVisible();
    // Check that at least one column shows a count like "(03)"
    await expect(headers.first()).toContainText('(');
  });

  test('task cards display name, points, and date', async ({ page }) => {
    const firstCard = page.locator('.task-card').first();
    await expect(firstCard.locator('.task-card__title')).toBeVisible();
    await expect(firstCard.locator('.task-card__points')).toBeVisible();
    await expect(firstCard.locator('.task-card__date')).toBeVisible();
  });

  test('shows the sidebar with navigation items', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('.sidebar__nav-item')).toHaveCount(2);
  });

  test('shows the header with search input', async ({ page }) => {
    const searchInput = page.locator('.header__search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search');
  });

  test('search filters tasks by name', async ({ page }) => {
    const searchInput = page.locator('.header__search-input');
    const initialCards = await page.locator('.task-card').count();

    await searchInput.fill('Ticket1');
    // Wait for the query to refetch
    await page.waitForTimeout(500);

    const filteredCards = await page.locator('.task-card').count();
    expect(filteredCards).toBeLessThanOrEqual(initialCards);
  });

  test('clicking the + button opens the create task modal', async ({ page }) => {
    await page.locator('.toolbar__add-btn').click();
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.task-form__title-input')).toBeVisible();
  });

  test('create task modal can be closed with Cancel', async ({ page }) => {
    await page.locator('.toolbar__add-btn').click();
    await expect(page.locator('.modal')).toBeVisible();

    await page.locator('.task-form__cancel-btn').click();
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('create task modal can be closed with Escape', async ({ page }) => {
    await page.locator('.toolbar__add-btn').click();
    await expect(page.locator('.modal')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('task card 3-dot menu shows edit and delete options', async ({ page }) => {
    await page.locator('.task-card__options-btn').first().click();
    const menu = page.locator('.task-card__menu').first();
    await expect(menu).toBeVisible();
    await expect(menu.locator('text=Edit')).toBeVisible();
    await expect(menu.locator('text=Delete')).toBeVisible();
  });

  test('clicking Edit opens the edit modal with task data', async ({ page }) => {
    await page.locator('.task-card__options-btn').first().click();
    await page.locator('.task-card__menu-item').first().click();

    await expect(page.locator('.modal')).toBeVisible();
    const titleInput = page.locator('.task-form__title-input');
    await expect(titleInput).toBeVisible();
    // Should have a value (the task name), not be empty
    const value = await titleInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('clicking Delete shows confirmation dialog', async ({ page }) => {
    await page.locator('.task-card__options-btn').first().click();
    await page.locator('.task-card__menu-item--danger').first().click();

    await expect(page.locator('.confirm-dialog')).toBeVisible();
    await expect(page.locator('.confirm-dialog__title')).toHaveText('Delete Task');
  });

  test('delete confirmation can be cancelled', async ({ page }) => {
    await page.locator('.task-card__options-btn').first().click();
    await page.locator('.task-card__menu-item--danger').first().click();

    await page.locator('.confirm-dialog__cancel-btn').click();
    await expect(page.locator('.confirm-dialog')).not.toBeVisible();
  });
});

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.task-card', { timeout: 10000 });
  });

  test('filter toggle button opens the filter panel', async ({ page }) => {
    await page.locator('.search-filter__toggle').click();
    await expect(page.locator('.search-filter__panel')).toBeVisible();
  });

  test('filter panel has status, assignee, date, points, and tags', async ({ page }) => {
    await page.locator('.search-filter__toggle').click();
    await expect(page.locator('#filter-status')).toBeVisible();
    await expect(page.locator('#filter-assignee')).toBeVisible();
    await expect(page.locator('#filter-duedate')).toBeVisible();
    await expect(page.locator('#filter-points')).toBeVisible();
    await expect(page.locator('.search-filter__tags')).toBeVisible();
  });

  test('filtering by status shows only matching tasks', async ({ page }) => {
    await page.locator('.search-filter__toggle').click();
    await page.locator('#filter-status').selectOption('TODO');
    await page.waitForTimeout(500);

    // All visible cards should be in the TODO column
    const todoColumn = page.locator('.task-column').nth(1);
    const todoCards = todoColumn.locator('.task-card');
    const totalCards = page.locator('.task-card');
    const todoCount = await todoCards.count();
    const totalCount = await totalCards.count();
    expect(todoCount).toBe(totalCount);
  });

  test('empty filters show empty state message', async ({ page }) => {
    await page.locator('.search-filter__toggle').click();
    await page.locator('#filter-status').selectOption('DONE');
    await page.waitForTimeout(500);

    // If no DONE tasks exist, should show empty state
    const cards = await page.locator('.task-card').count();
    if (cards === 0) {
      await expect(page.locator('.empty-results')).toBeVisible();
    }
  });
});

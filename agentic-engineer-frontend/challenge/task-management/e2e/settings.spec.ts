import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('displays the settings title', async ({ page }) => {
    await expect(page.locator('.settings__title')).toHaveText('Settings');
  });

  test('shows user profile information from the API', async ({ page }) => {
    // Wait for profile to load
    await page.waitForSelector('.settings__card', { timeout: 10000 });

    const card = page.locator('.settings__card');
    await expect(card.locator('text=Full Name')).toBeVisible();
    await expect(card.locator('text=Email')).toBeVisible();
    await expect(card.locator('text=Type')).toBeVisible();
    await expect(card.locator('text=Created At')).toBeVisible();
    await expect(card.locator('text=Updated At')).toBeVisible();
  });

  test('displays the actual user name from the API', async ({ page }) => {
    await page.waitForSelector('.settings__card', { timeout: 10000 });

    // The profile should show a real name (not empty)
    const nameValue = page.locator('.settings__row').first().locator('.settings__value');
    const text = await nameValue.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });
});

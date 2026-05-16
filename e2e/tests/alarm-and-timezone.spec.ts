import { test, expect } from '@playwright/test';

test.describe('Jam Dunia Baru E2E flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('set alarm and verify it appears in the alarm list', async ({ page }) => {
    await page.locator('button.control-btn:has-text("🔔⏱️")').click();
    await page.locator('button.btn-primary:has-text("+ Tambah Alarm")').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();

    await page.locator('#alarm-time').fill('08:30');
    await page.locator('#alarm-label').fill('Uji Alarm');
    await page.locator('button[type="submit"]:has-text("Tambah Alarm")').click();

    await expect(page.locator('.alarm-item .alarm-time')).toHaveText('08:30');
    await expect(page.locator('.alarm-item .alarm-label')).toHaveText('Uji Alarm');
  });

  test('convert timezone from Jakarta to Tokyo and show results', async ({ page }) => {
    await page.locator('.converter-toggle').click();

    const fromGroup = page.locator('.city-input-group').nth(0);
    const toGroup = page.locator('.city-input-group').nth(1);

    await fromGroup.locator('input.city-search-input').click();
    await fromGroup.locator('input.city-search-input').fill('Jakarta');
    await page.locator('.dropdown-item', { hasText: 'Jakarta' }).click();

    await toGroup.locator('input.city-search-input').click();
    await toGroup.locator('input.city-search-input').fill('Tokyo');
    await page.locator('.dropdown-item', { hasText: 'Tokyo' }).click();

    await expect(page.locator('.result-card.source .city-name')).toHaveText('Jakarta');
    await expect(page.locator('.result-card.target .city-name')).toHaveText('Tokyo');
    await expect(page.locator('.result-section')).toBeVisible();
  });
});

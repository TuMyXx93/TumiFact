import { expect, test } from '@playwright/test';

test('vertical slice POS renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('POS Nuevo Stack')).toBeVisible();
});

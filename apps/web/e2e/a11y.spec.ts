import { expect, test } from '@playwright/test';

test('POS has accessible primary action', async ({ page }) => {
  await page.goto('/');
  const buttons = page.getByRole('button');
  await expect(buttons.first()).toBeVisible();
});

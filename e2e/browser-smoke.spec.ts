import { expect, test } from '@playwright/test';

for (const locale of ['en', 'ar'] as const) {
  test('browser smoke ' + locale, async ({ page, browserName }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    const response = await page.goto('/' + locale);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, browserName + ' horizontal overflow').toBeLessThanOrEqual(1);

    await page.goto('/' + locale + '/contact');
    await expect(page.locator('form.contact-form')).toBeVisible();
    expect(consoleErrors, browserName + ' console errors').toEqual([]);
  });
}

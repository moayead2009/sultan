import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
] as const;

for (const locale of ['en', 'ar'] as const) {
  for (const viewport of viewports) {
    test(locale + ' responsive ' + viewport.name + ' has no horizontal overflow', async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of ['', '/services', '/capabilities', '/contact']) {
        await page.goto('/' + locale + route);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
        await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      }

      await page.goto('/' + locale + '/capabilities');
      if (viewport.width > 980) {
        await expect(page.locator('.capability-table')).toBeVisible();
      } else {
        await expect(page.locator('.capability-mobile')).toBeVisible();
      }

      if (viewport.width <= 980) {
        await expect(page.locator('.mobile-nav')).toBeVisible();
        await page.locator('.mobile-nav > summary').click();
        await expect(page.locator('.mobile-nav__panel')).toBeVisible();
      } else {
        await expect(page.locator('.desktop-nav')).toBeVisible();
      }
    });
  }

  test(locale + ' keyboard focus and 200 percent zoom remain usable', async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 900 });
    await page.goto('/' + locale);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName || '');
    expect(focused).not.toBe('BODY');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test(locale + ' reduced-motion preference disables meaningful transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/' + locale + '/services');
    const duration = await page.locator('.service-card').first().evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
  });
}

test('language switch preserves equivalent service route', async ({ page }) => {
  await page.goto('/en/services/theater-engineering-construction');
  await page.getByRole('link', { name: 'العربية' }).first().click();
  await expect(page).toHaveURL(/\/ar\/services\/theater-engineering-construction$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

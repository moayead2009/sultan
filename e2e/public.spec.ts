import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { db } from '../lib/db';
import { ensureE2EProject } from './helpers';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await ensureE2EProject();
});

const routes = [
  '',
  '/about',
  '/services',
  '/services/theater-engineering-construction',
  '/projects',
  '/projects/phase3-e2e-project',
  '/capabilities',
  '/clients',
  '/contact'
];

for (const locale of ['en', 'ar'] as const) {
  test('public routes work in ' + locale, async ({ page }) => {
    for (const route of routes) {
      const response = await page.goto('/' + locale + route);
      expect(response?.status(), locale + route).toBe(200);
      expect(response?.headers()['x-content-type-options']).toBe('nosniff');
      expect(response?.headers()['x-frame-options']).toBe('DENY');
      expect(response?.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('major public pages have no serious axe violations in ' + locale, async ({ page }) => {
    for (const route of routes) {
      await page.goto('/' + locale + route);
      const result = await new AxeBuilder({ page }).analyze();
      const blockers = result.violations.filter((violation) =>
        violation.impact === 'critical' || violation.impact === 'serious'
      );
      expect(blockers, locale + route + ': ' + blockers.map((item) => item.id).join(', ')).toEqual([]);
    }
  });

  test('public internal links are not broken in ' + locale, async ({ page, request }) => {
    const origins = ['', '/about', '/services', '/contact'];
    const hrefs = new Set<string>();
    for (const origin of origins) {
      await page.goto('/' + locale + origin);
      const links = await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).getAttribute('href') || ''));
      for (const href of links) {
        if (href.startsWith('/' + locale) && !href.includes('#')) hrefs.add(href);
      }
    }
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), href).toBeLessThan(400);
    }
  });

  test('localized 404 works in ' + locale, async ({ page }) => {
    const response = await page.goto('/' + locale + '/this-route-does-not-exist-phase3');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText(locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found');
  });

  test('contact form persists a submission in ' + locale, async ({ page }) => {
    const email = 'phase3-form@example.invalid';
    await db.contactSubmission.deleteMany({ where: { email } });
    await page.goto('/' + locale + '/contact');
    await page.locator('input[name="name"]').fill(locale === 'ar' ? 'اختبار المرحلة الثالثة' : 'Phase 3 Test');
    await page.locator('input[name="organization"]').fill('Solutions Gate QA');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('textarea[name="message"]').fill(locale === 'ar' ? 'هذه رسالة اختبار آلية للنموذج العام.' : 'This is an automated Phase 3 public form test message.');
    await page.locator('input[name="consent"]').check();
    await page.getByRole('button', { name: locale === 'ar' ? 'إرسال الاستفسار' : 'Send inquiry' }).click();
    await expect(page.getByRole('status')).toContainText(locale === 'ar' ? 'تم استلام رسالتك بنجاح' : 'received successfully');

    const stored = await db.contactSubmission.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
    expect(stored?.locale).toBe(locale);
    expect(stored?.notificationStatus).toBe('NOT_CONFIGURED');
    await db.contactSubmission.deleteMany({ where: { email } });
  });
}

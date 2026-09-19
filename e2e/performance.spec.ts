import { expect, test } from '@playwright/test';
import { ensureE2EProject } from './helpers';

test.beforeAll(async () => {
  await ensureE2EProject();
});

const routes = [
  '/en',
  '/en/services/theater-engineering-construction',
  '/en/projects/phase3-e2e-project',
  '/en/contact'
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
] as const;

async function measure(page: import('@playwright/test').Page, route: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    const target = window as unknown as { __phase3Vitals?: { lcp: number; cls: number } };
    target.__phase3Vitals = { lcp: 0, cls: 0 };

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const latest = entries[entries.length - 1];
      if (latest) target.__phase3Vitals!.lcp = latest.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (!shift.hadRecentInput) target.__phase3Vitals!.cls += shift.value || 0;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const response = await page.goto(route, { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(200);
  await page.waitForTimeout(750);

  return page.evaluate(() => {
    const target = window as unknown as { __phase3Vitals?: { lcp: number; cls: number } };
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {
      lcp: target.__phase3Vitals?.lcp || 0,
      cls: target.__phase3Vitals?.cls || 0,
      transferBytes: resources.reduce((sum, item) => sum + (item.transferSize || 0), 0),
      scriptBytes: resources.filter((item) => item.initiatorType === 'script').reduce((sum, item) => sum + (item.transferSize || 0), 0),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
}

for (const viewport of viewports) {
  for (const route of routes) {
    test('production performance ' + viewport.name + ' ' + route, async ({ page }) => {
      const metrics = await measure(page, route, viewport);
      expect(metrics.horizontalOverflow).toBeLessThanOrEqual(1);
      expect(metrics.cls).toBeLessThanOrEqual(0.1);
      expect(metrics.lcp).toBeGreaterThan(0);
      expect(metrics.lcp).toBeLessThan(5000);
      expect(metrics.transferBytes).toBeLessThan(2_500_000);
      expect(metrics.scriptBytes).toBeLessThan(850_000);
    });
  }
}

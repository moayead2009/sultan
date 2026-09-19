import { readFile } from 'fs/promises';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { inspectUpload } from '@/lib/media';
import { siteStructuredData, serviceStructuredData } from '@/lib/structured-data';

describe('Phase 3 SEO discovery infrastructure', () => {
  it('publishes only approved public URLs in sitemap', async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith('/en'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/ar'))).toBe(true);
    expect(urls.some((url) => url.includes('/en/services/theater-engineering-construction'))).toBe(true);
    expect(urls.some((url) => url.includes('/admin'))).toBe(false);
    expect(urls.some((url) => url.includes('/preview'))).toBe(false);
    expect(urls.some((url) => url.endsWith('/en/privacy'))).toBe(false);
  });

  it('robots excludes protected surfaces and publishes sitemap location', async () => {
    const value = await robots();
    const rules = Array.isArray(value.rules) ? value.rules : [value.rules];
    const disallow = rules.flatMap((rule) => Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : []);

    expect(disallow).toEqual(expect.arrayContaining(['/admin', '/preview', '/api']));
    expect(value.sitemap).toContain('/sitemap.xml');
  });

  it('structured data contains verified organization/site/service types only', () => {
    const site = siteStructuredData({
      baseUrl: 'https://solutiongate.sa',
      brandEnglish: 'Solutions Gate',
      brandArabic: 'بوابة الحلول للفعاليات',
      logoUrl: '/uploads/source-profile/logo-mark.webp'
    });
    const service = serviceStructuredData({
      baseUrl: 'https://solutiongate.sa',
      locale: 'en',
      slug: 'event-design-production',
      name: 'Event Design and Production',
      description: 'Event production service',
      providerName: 'Solutions Gate',
      providerArabic: 'بوابة الحلول للفعاليات'
    });

    const serialized = JSON.stringify([site, service]);
    expect(serialized).toContain('"Organization"');
    expect(serialized).toContain('"WebSite"');
    expect(serialized).toContain('"Service"');
    expect(serialized).not.toContain('LocalBusiness');
    expect(serialized).not.toContain('aggregateRating');
    expect(serialized).not.toContain('review');
  });
});

describe('Phase 3 media upload hardening', () => {
  it('validates, re-encodes and strips source metadata from an approved image', async () => {
    const input = await readFile('public/uploads/source-profile/logo-mark.webp');
    const file = new File([input], 'phase3-test.webp', { type: 'image/webp' });
    const result = await inspectUpload(file);
    const metadata = await sharp(result.buffer).metadata();

    expect(result.mimeType).toBe('image/webp');
    expect(result.byteSize).toBe(result.buffer.length);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
  });

  it('rejects mismatched MIME/signature data', async () => {
    const input = await readFile('public/uploads/source-profile/logo-mark.webp');
    const file = new File([input], 'fake.png', { type: 'image/png' });
    await expect(inspectUpload(file)).rejects.toThrow(/signature/i);
  });
});

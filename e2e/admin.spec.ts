import { readFile } from 'fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { db } from '../lib/db';
import {
  adminEmail,
  adminPassword,
  ensureE2EPage,
  ensureE2EUsers,
  ownerEmail,
  ownerPassword
} from './helpers';

test.describe.configure({ mode: 'serial' });

async function login(page: Page, email: string, password: string) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?.*)?$/);
}

test.beforeAll(async () => {
  await ensureE2EUsers();
  await ensureE2EPage();
});

test('failed login stays on protected sign-in', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ownerEmail);
  await page.getByLabel('Password').fill('definitely-wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.auth-card [role="alert"]')).toContainText('Unable to sign in');
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('owner login succeeds and unauthenticated admin route is protected', async ({ browser }) => {
  const anonymous = await browser.newPage();
  await anonymous.goto('/admin/users');
  await expect(anonymous).toHaveURL(/\/admin\/login/);
  await anonymous.close();

  const page = await browser.newPage();
  await login(page, ownerEmail, ownerPassword);
  await expect(page.getByText('Solutions Gate CMS')).toBeVisible();
  await page.close();
});

test('ADMIN cannot access OWNER-only user management', async ({ page }) => {
  await login(page, adminEmail, adminPassword);
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\?unauthorized=1$/);
});

test('owner can edit bilingual page content, order sections, preview, publish and unpublish', async ({ page }) => {
  const fixture = await ensureE2EPage();
  await login(page, ownerEmail, ownerPassword);

  await page.goto('/admin/pages?q=phase3-e2e-page');
  const article = page.locator('article.admin-card').filter({ hasText: '/phase3-e2e-page' });
  await expect(article).toBeVisible();

  const enForm = article.getByRole('heading', { name: 'EN' }).locator('xpath=ancestor::form');
  await enForm.locator('input[name="title"]').fill('Phase 3 Test Page Updated');
  await enForm.locator('textarea[name="summary"]').fill('Updated English browser-test content.');
  await enForm.getByRole('button', { name: 'Save EN' }).click();
  await expect(page.locator('article.admin-card').filter({ hasText: '/phase3-e2e-page' })).toBeVisible();

  const refreshed = page.locator('article.admin-card').filter({ hasText: '/phase3-e2e-page' });
  const arForm = refreshed.getByRole('heading', { name: 'AR' }).locator('xpath=ancestor::form');
  await arForm.locator('input[name="title"]').fill('صفحة اختبار المرحلة الثالثة المحدثة');
  await arForm.locator('textarea[name="summary"]').fill('محتوى عربي محدث لاختبار المتصفح.');
  await arForm.getByRole('button', { name: 'Save AR' }).click();

  await page.goto('/admin/sections?pageId=' + fixture.page.id);
  const section = page.locator('article.admin-card').filter({ hasText: 'phase3-body' });
  await section.locator('input[name="sortOrder"]').fill('27');
  await section.getByRole('button', { name: 'Save section' }).click();
  expect((await db.pageSection.findUniqueOrThrow({ where: { id: fixture.section.id } })).sortOrder).toBe(27);

  const currentSection = page.locator('article.admin-card').filter({ hasText: 'phase3-body' });
  await currentSection.getByRole('button', { name: 'Disable' }).click();
  await expect(page.locator('article.admin-card').filter({ hasText: 'phase3-body' })).toContainText('Disabled');
  await page.locator('article.admin-card').filter({ hasText: 'phase3-body' }).getByRole('button', { name: 'Enable' }).click();
  await expect(page.locator('article.admin-card').filter({ hasText: 'phase3-body' })).toContainText('Enabled');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Permanently delete');
    await dialog.dismiss();
  });
  await page.locator('article.admin-card').filter({ hasText: 'phase3-body' }).getByRole('button', { name: 'Hard delete' }).click();
  await expect(page.locator('article.admin-card').filter({ hasText: 'phase3-body' })).toBeVisible();

  const enPreview = await page.goto('/preview/en/phase3-e2e-page');
  expect(enPreview?.status()).toBe(200);
  expect(enPreview?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.getByRole('heading', { name: 'Phase 3 Test Page Updated' })).toBeVisible();

  await page.goto('/preview/ar/phase3-e2e-page');
  await expect(page.getByRole('heading', { name: 'صفحة اختبار المرحلة الثالثة المحدثة' })).toBeVisible();

  await page.goto('/admin/pages?q=phase3-e2e-page');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('article.admin-card').filter({ hasText: '/phase3-e2e-page' }).getByRole('button', { name: 'Publish' }).click();
  await expect(page.locator('article.admin-card').filter({ hasText: '/phase3-e2e-page' })).toContainText('PUBLISHED');

  let response = await page.goto('/en/phase3-e2e-page');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Phase 3 Test Page Updated' })).toBeVisible();

  await page.goto('/admin/pages?q=phase3-e2e-page');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('article.admin-card').filter({ hasText: '/phase3-e2e-page' }).getByRole('button', { name: 'Unpublish' }).click();
  await expect(page.locator('article.admin-card').filter({ hasText: '/phase3-e2e-page' })).toContainText('DRAFT');

  response = await page.goto('/en/phase3-e2e-page');
  expect(response?.status()).toBe(404);
});

test('owner can upload sanitized media and sees destructive confirmation', async ({ page }) => {
  await db.mediaAsset.deleteMany({ where: { originalFilename: 'phase3-e2e.webp' } });
  await login(page, ownerEmail, ownerPassword);
  await page.goto('/admin/media');

  const buffer = await readFile('public/uploads/source-profile/logo-mark.webp');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'phase3-e2e.webp',
    mimeType: 'image/webp',
    buffer
  });
  await page.getByLabel('English alt text').fill('Phase 3 media test');
  await page.getByLabel('Arabic alt text').fill('اختبار وسائط المرحلة الثالثة');
  await page.getByRole('button', { name: 'Upload media' }).click();
  await page.waitForLoadState('networkidle');

  await page.goto('/admin/media?q=phase3-e2e.webp');
  await expect(page.getByText('phase3-e2e.webp')).toBeVisible();
  const asset = await db.mediaAsset.findFirstOrThrow({ where: { originalFilename: 'phase3-e2e.webp' } });
  expect(asset.byteSize).toBeGreaterThan(0);

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('delete');
    await dialog.dismiss();
  });
  await page.locator('tr').filter({ hasText: 'phase3-e2e.webp' }).getByRole('button').click();
  await expect(page.getByText('phase3-e2e.webp')).toBeVisible();
});

test('SEO editing and inquiry status management work through admin UI', async ({ page }) => {
  const fixture = await ensureE2EPage();
  const inquiry = await db.contactSubmission.create({
    data: {
      name: 'Phase 3 Admin Inquiry',
      email: 'phase3-admin-inquiry@example.invalid',
      message: 'Inquiry created for the Phase 3 admin browser test.',
      locale: 'en',
      consentJson: { responseUseAccepted: true },
      notificationStatus: 'NOT_CONFIGURED'
    }
  });

  await login(page, ownerEmail, ownerPassword);
  await page.goto('/admin/seo');
  const seoForm = page.locator('form.admin-card').filter({ hasText: 'Page: phase3-e2e-page' }).filter({ hasText: 'EN' });
  await seoForm.getByLabel('Title').fill('Phase 3 SEO Updated');
  await seoForm.getByRole('button', { name: 'Save SEO' }).click();
  const seo = await db.seoMetadata.findUniqueOrThrow({
    where: { ownerType_ownerId_locale: { ownerType: 'Page', ownerId: fixture.page.id, locale: 'en' } }
  });
  expect(seo.title).toBe('Phase 3 SEO Updated');

  await page.goto('/admin/inquiries?q=phase3-admin-inquiry');
  const card = page.locator('article.admin-card').filter({ hasText: 'phase3-admin-inquiry@example.invalid' });
  await expect(card).toBeVisible();
  await card.locator('select[name="status"]').selectOption('IN_PROGRESS');
  await card.getByRole('button', { name: 'Update status' }).click();
  expect((await db.contactSubmission.findUniqueOrThrow({ where: { id: inquiry.id } })).status).toBe('IN_PROGRESS');
  await db.contactSubmission.delete({ where: { id: inquiry.id } });
});


test('admin remains usable at desktop tablet and mobile widths', async ({ page }) => {
  await login(page, ownerEmail, ownerPassword);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ['/admin', '/admin/pages', '/admin/media', '/admin/inquiries']) {
      await page.goto(route);
      await expect(page.locator('.admin-main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, route + ' at ' + viewport.width).toBeLessThanOrEqual(1);
    }
  }
});

test('media API enforces origin and authentication', async ({ request }) => {
  const crossOrigin = await request.post('/api/admin/media', {
    headers: { origin: 'https://evil.example.invalid' },
    multipart: { altEn: 'No access', altAr: 'لا وصول' }
  });
  expect(crossOrigin.status()).toBe(403);

  const sameOriginAnonymous = await request.post('/api/admin/media', {
    headers: { origin: 'http://localhost:3000' },
    multipart: { altEn: 'No access', altAr: 'لا وصول' }
  });
  expect(sameOriginAnonymous.status()).toBe(401);
});

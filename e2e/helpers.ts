import { hash } from '@node-rs/argon2';
import { db } from '../lib/db';

export const ownerEmail = 'phase3-owner@example.invalid';
export const ownerPassword = 'Phase3-Owner-Password-123!';
export const adminEmail = 'phase3-admin@example.invalid';
export const adminPassword = 'Phase3-Admin-Password-123!';

export async function ensureE2EUsers() {
  await db.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: 'Phase 3 Owner',
      passwordHash: await hash(ownerPassword),
      role: 'OWNER',
      status: 'ACTIVE'
    },
    create: {
      name: 'Phase 3 Owner',
      email: ownerEmail,
      passwordHash: await hash(ownerPassword),
      role: 'OWNER',
      status: 'ACTIVE'
    }
  });
  await db.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Phase 3 Admin',
      passwordHash: await hash(adminPassword),
      role: 'ADMIN',
      status: 'ACTIVE'
    },
    create: {
      name: 'Phase 3 Admin',
      email: adminEmail,
      passwordHash: await hash(adminPassword),
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
}

export async function ensureE2EProject() {
  const cover = await db.mediaAsset.findFirstOrThrow({
    where: { storageKey: 'source-profile/theater-stage.avif' }
  });
  const row = await db.project.upsert({
    where: { slug: 'phase3-e2e-project' },
    update: {
      coverMediaId: cover.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      featured: false
    },
    create: {
      slug: 'phase3-e2e-project',
      coverMediaId: cover.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      featured: false
    }
  });
  await db.projectTranslation.upsert({
    where: { projectId_locale: { projectId: row.id, locale: 'en' } },
    update: { title: 'Phase 3 Browser Test Project', summary: 'Temporary browser-test project.' },
    create: { projectId: row.id, locale: 'en', title: 'Phase 3 Browser Test Project', summary: 'Temporary browser-test project.' }
  });
  await db.projectTranslation.upsert({
    where: { projectId_locale: { projectId: row.id, locale: 'ar' } },
    update: { title: 'مشروع اختبار المتصفح للمرحلة الثالثة', summary: 'مشروع مؤقت لاختبارات المتصفح.' },
    create: { projectId: row.id, locale: 'ar', title: 'مشروع اختبار المتصفح للمرحلة الثالثة', summary: 'مشروع مؤقت لاختبارات المتصفح.' }
  });
  return row;
}

export async function ensureE2EPage() {
  const page = await db.page.upsert({
    where: { slug: 'phase3-e2e-page' },
    update: { template: 'about', status: 'DRAFT', publishedAt: null },
    create: { slug: 'phase3-e2e-page', template: 'about', status: 'DRAFT' }
  });
  for (const locale of ['en', 'ar'] as const) {
    const title = locale === 'en' ? 'Phase 3 Test Page' : 'صفحة اختبار المرحلة الثالثة';
    const summary = locale === 'en' ? 'Temporary browser test page.' : 'صفحة مؤقتة لاختبارات المتصفح.';
    await db.pageTranslation.upsert({
      where: { pageId_locale: { pageId: page.id, locale } },
      update: { title, navigationLabel: title, summary },
      create: { pageId: page.id, locale, title, navigationLabel: title, summary }
    });
    await db.seoMetadata.upsert({
      where: { ownerType_ownerId_locale: { ownerType: 'Page', ownerId: page.id, locale } },
      update: { title, description: summary },
      create: { ownerType: 'Page', ownerId: page.id, locale, title, description: summary }
    });
  }

  const section = await db.pageSection.upsert({
    where: { pageId_key: { pageId: page.id, key: 'phase3-body' } },
    update: {
      sectionType: 'richText',
      sortOrder: 10,
      enabled: true,
      settingsVersion: 1,
      settingsJson: { maxWidth: 'prose', themeVariant: 'light' }
    },
    create: {
      pageId: page.id,
      key: 'phase3-body',
      sectionType: 'richText',
      sortOrder: 10,
      enabled: true,
      settingsVersion: 1,
      settingsJson: { maxWidth: 'prose', themeVariant: 'light' }
    }
  });
  await db.pageSectionTranslation.upsert({
    where: { sectionId_locale: { sectionId: section.id, locale: 'en' } },
    update: { title: 'Browser test section', body: 'English browser-test content.' },
    create: { sectionId: section.id, locale: 'en', title: 'Browser test section', body: 'English browser-test content.' }
  });
  await db.pageSectionTranslation.upsert({
    where: { sectionId_locale: { sectionId: section.id, locale: 'ar' } },
    update: { title: 'قسم اختبار المتصفح', body: 'محتوى عربي لاختبار المتصفح.' },
    create: { sectionId: section.id, locale: 'ar', title: 'قسم اختبار المتصفح', body: 'محتوى عربي لاختبار المتصفح.' }
  });
  return { page, section };
}

export async function cleanupE2ERecords() {
  const project = await db.project.findUnique({ where: { slug: 'phase3-e2e-project' } });
  if (project) await db.project.delete({ where: { id: project.id } });

  const page = await db.page.findUnique({ where: { slug: 'phase3-e2e-page' } });
  if (page) {
    await db.seoMetadata.deleteMany({ where: { ownerType: 'Page', ownerId: page.id } });
    await db.page.delete({ where: { id: page.id } });
  }

  await db.contactSubmission.deleteMany({
    where: { email: { in: ['phase3-form@example.invalid', 'phase3-admin-inquiry@example.invalid'] } }
  });
  await db.mediaAsset.deleteMany({ where: { originalFilename: 'phase3-e2e.png' } });
}

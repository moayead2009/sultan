'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { setOwnerUsagePublication } from '@/lib/media-usage';
import { validatePageSections, validatePublishable } from '@/lib/publication';

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const shortText = z.string().trim().max(500);
const longText = z.string().trim().max(20000);

export async function createPage(formData: FormData) {
  await requireAdmin();
  const pageSlug = slug.parse(formData.get('slug'));
  const template = z.enum(['home','about','services','service','projects','project','capabilities','clients','contact','legal']).parse(formData.get('template'));
  const enTitle = shortText.min(1).parse(formData.get('enTitle'));
  const arTitle = shortText.min(1).parse(formData.get('arTitle'));

  const page = await db.page.create({
    data: {
      slug: pageSlug,
      template,
      translations: { create: [
        { locale: 'en', title: enTitle, navigationLabel: enTitle },
        { locale: 'ar', title: arTitle, navigationLabel: arTitle }
      ] }
    }
  });
  await auditAdmin('CREATE', 'Page', page.id);
  revalidatePath('/admin/pages');
}

export async function updatePageTranslation(formData: FormData) {
  await requireAdmin();
  const pageId = z.string().min(1).parse(formData.get('pageId'));
  const locale = z.enum(['en','ar']).parse(formData.get('locale'));
  const title = shortText.min(1).parse(formData.get('title'));
  const summary = longText.parse(String(formData.get('summary') ?? '')) || null;
  const navigationLabel = shortText.parse(String(formData.get('navigationLabel') ?? '')) || null;

  await db.pageTranslation.upsert({
    where: { pageId_locale: { pageId, locale } },
    create: { pageId, locale, title, summary, navigationLabel },
    update: { title, summary, navigationLabel }
  });

  const seoTitle = shortText.parse(String(formData.get('seoTitle') ?? ''));
  const seoDescription = longText.parse(String(formData.get('seoDescription') ?? ''));
  if (seoTitle || seoDescription) {
    if (!seoTitle || !seoDescription) throw new Error('SEO title and description must be provided together.');
    await db.seoMetadata.upsert({
      where: { ownerType_ownerId_locale: { ownerType: 'Page', ownerId: pageId, locale } },
      create: { ownerType: 'Page', ownerId: pageId, locale, title: seoTitle, description: seoDescription },
      update: { title: seoTitle, description: seoDescription }
    });
  }

  await auditAdmin('UPDATE_TRANSLATION', 'Page', pageId, { locale });
  revalidatePath('/admin/pages');
}

export async function publishPage(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const page = await db.page.findUniqueOrThrow({
    where: { id },
    include: { translations: true, sections: { include: { translations: true } } }
  });
  const sectionGate = validatePageSections(page.sections);
  const seo = await db.seoMetadata.findMany({ where: { ownerType: 'Page', ownerId: id } });
  const seoComplete = ['en','ar'].every((locale) =>
    seo.some((row) => row.locale === locale && row.title.trim().length > 0 && row.description.trim().length > 0)
  );
  const gate = validatePublishable('page', {
    translations: page.translations,
    enabledSectionsComplete: sectionGate.ok,
    sectionMissing: sectionGate.missing,
    seoComplete
  });
  if (!gate.ok) throw new Error('Publication blocked. Missing: ' + gate.missing.join(', '));

  await db.$transaction(async (tx) => {
    await tx.page.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    await setOwnerUsagePublication(tx, 'PageSection', page.sections.filter((s) => s.enabled).map((s) => s.id), true);
    await setOwnerUsagePublication(tx, 'PageSection', page.sections.filter((s) => !s.enabled).map((s) => s.id), false);
  });
  await auditAdmin('PUBLISH', 'Page', id);
  revalidatePath('/admin/pages');
}

export async function unpublishPage(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const sections = await db.pageSection.findMany({ where: { pageId: id }, select: { id: true } });
  await db.$transaction(async (tx) => {
    await tx.page.update({ where: { id }, data: { status: 'DRAFT', publishedAt: null } });
    await setOwnerUsagePublication(tx, 'PageSection', sections.map((s) => s.id), false);
  });
  await auditAdmin('UNPUBLISH', 'Page', id);
  revalidatePath('/admin/pages');
}

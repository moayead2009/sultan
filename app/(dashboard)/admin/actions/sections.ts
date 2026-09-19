'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, ctaTarget, integer, optionalText } from '@/lib/admin-input';
import { collectSectionMediaUsages, replaceMediaUsage, setOwnerUsagePublication } from '@/lib/media-usage';
import { assertSectionAllowed, parseSectionSettings } from '@/lib/section-schemas';
import { validateSectionCompleteness } from '@/lib/publication';

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export async function createSection(formData: FormData) {
  await requireAdmin();
  const pageId = z.string().min(1).parse(formData.get('pageId'));
  const page = await db.page.findUniqueOrThrow({ where: { id: pageId } });
  const sectionType = z.string().min(1).parse(formData.get('sectionType'));
  assertSectionAllowed(page.template as Parameters<typeof assertSectionAllowed>[0], sectionType);
  const settings = JSON.parse(String(formData.get('settingsJson') || '{}')) as unknown;
  parseSectionSettings(sectionType, 1, settings);

  const section = await db.pageSection.create({
    data: {
      pageId,
      key: slug.parse(formData.get('key')),
      sectionType,
      sortOrder: integer(formData.get('sortOrder')),
      settingsVersion: 1,
      settingsJson: JSON.parse(JSON.stringify(settings)),
      translations: { create: [
        { locale: 'en', title: optionalText(formData.get('enTitle')) },
        { locale: 'ar', title: optionalText(formData.get('arTitle')) }
      ] }
    }
  });
  await auditAdmin('CREATE', 'PageSection', section.id, { pageId });
  revalidatePath('/admin/sections');
}

export async function updateSection(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const existing = await db.pageSection.findUniqueOrThrow({
    where: { id },
    include: { page: true }
  });
  const settings = JSON.parse(String(formData.get('settingsJson') || '{}')) as unknown;
  parseSectionSettings(existing.sectionType, existing.settingsVersion, settings);

  const primaryCta = ctaTarget(formData.get('primaryCtaPageId'), formData.get('primaryCtaUrl'));
  const secondaryCta = ctaTarget(formData.get('secondaryCtaPageId'), formData.get('secondaryCtaUrl'));
  const en = {
    locale: 'en' as const,
    title: optionalText(formData.get('enTitle')),
    subtitle: optionalText(formData.get('enSubtitle')),
    body: optionalText(formData.get('enBody')),
    primaryCtaLabel: optionalText(formData.get('enPrimaryCtaLabel')),
    secondaryCtaLabel: optionalText(formData.get('enSecondaryCtaLabel')),
    accessibleLabel: optionalText(formData.get('enAccessibleLabel'))
  };
  const ar = {
    locale: 'ar' as const,
    title: optionalText(formData.get('arTitle')),
    subtitle: optionalText(formData.get('arSubtitle')),
    body: optionalText(formData.get('arBody')),
    primaryCtaLabel: optionalText(formData.get('arPrimaryCtaLabel')),
    secondaryCtaLabel: optionalText(formData.get('arSecondaryCtaLabel')),
    accessibleLabel: optionalText(formData.get('arAccessibleLabel'))
  };
  const enabled = checkbox(formData.get('enabled'));
  const desired = {
    sectionType: existing.sectionType,
    translations: [en, ar],
    primaryCtaPageId: primaryCta.pageId,
    primaryCtaUrl: primaryCta.url,
    secondaryCtaPageId: secondaryCta.pageId,
    secondaryCtaUrl: secondaryCta.url
  };
  if (enabled && existing.page.status === 'PUBLISHED') {
    const result = validateSectionCompleteness(desired);
    if (!result.ok) throw new Error('Published section is incomplete: ' + result.missing.join(', '));
  }

  const primaryMediaId = optionalText(formData.get('primaryMediaId'));
  const secondaryMediaId = optionalText(formData.get('secondaryMediaId'));
  const galleryMediaIds = String(formData.get('galleryMediaIds') ?? '')
    .split(',').map((v) => v.trim()).filter(Boolean);

  await db.$transaction(async (tx) => {
    await tx.pageSection.update({
      where: { id },
      data: {
        sortOrder: integer(formData.get('sortOrder')),
        enabled,
        settingsJson: JSON.parse(JSON.stringify(settings)),
        primaryMediaId,
        secondaryMediaId,
        primaryCtaPageId: primaryCta.pageId,
        primaryCtaUrl: primaryCta.url,
        secondaryCtaPageId: secondaryCta.pageId,
        secondaryCtaUrl: secondaryCta.url
      }
    });
    for (const row of [en, ar]) {
      await tx.pageSectionTranslation.upsert({
        where: { sectionId_locale: { sectionId: id, locale: row.locale } },
        create: { sectionId: id, ...row },
        update: row
      });
    }
    await tx.pageSectionMedia.deleteMany({ where: { sectionId: id } });
    if (galleryMediaIds.length) {
      await tx.pageSectionMedia.createMany({
        data: galleryMediaIds.map((mediaId, index) => ({ sectionId: id, mediaId, role: 'gallery', sortOrder: index }))
      });
    }
    await replaceMediaUsage(
      tx,
      'PageSection',
      id,
      collectSectionMediaUsages({
        primaryMediaId,
        secondaryMediaId,
        galleryMedia: galleryMediaIds.map((mediaId) => ({ mediaId, role: 'gallery' }))
      }),
      existing.page.status === 'PUBLISHED' && enabled
    );
  });

  await auditAdmin('UPDATE', 'PageSection', id);
  revalidatePath('/admin/sections');
}

export async function toggleSection(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const section = await db.pageSection.findUniqueOrThrow({
    where: { id },
    include: { page: true, translations: true }
  });
  const enabled = !section.enabled;
  if (enabled && section.page.status === 'PUBLISHED') {
    const gate = validateSectionCompleteness(section);
    if (!gate.ok) throw new Error('Cannot enable incomplete section on published page: ' + gate.missing.join(', '));
  }
  await db.$transaction(async (tx) => {
    await tx.pageSection.update({ where: { id }, data: { enabled } });
    await setOwnerUsagePublication(tx, 'PageSection', [id], section.page.status === 'PUBLISHED' && enabled);
  });
  await auditAdmin('TOGGLE', 'PageSection', id, { enabled });
  revalidatePath('/admin/sections');
}

export async function deleteSection(formData: FormData) {
  await requireAdmin(['OWNER']);
  const id = z.string().min(1).parse(formData.get('id'));
  const section = await db.pageSection.findUniqueOrThrow({ where: { id }, include: { page: true } });
  if (section.page.status === 'PUBLISHED' && section.enabled) {
    throw new Error('Disable or unpublish the section before hard deletion.');
  }
  await db.$transaction(async (tx) => {
    await tx.mediaUsage.deleteMany({ where: { ownerType: 'PageSection', ownerId: id } });
    await tx.pageSection.delete({ where: { id } });
  });
  await auditAdmin('DELETE', 'PageSection', id);
  revalidatePath('/admin/sections');
}

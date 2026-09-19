'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, integer, optionalText } from '@/lib/admin-input';
import { validatePublishable } from '@/lib/publication';
import { isSafeHttpUrl } from '@/lib/security-url';

const id = z.string().trim().min(1);
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function requiredText(formData: FormData, key: string, max = 500) {
  return z.string().trim().min(1).max(max).parse(formData.get(key));
}

export async function saveCapabilityPackage(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const enabled = checkbox(formData.get('enabled'));
  const needsOwnerLabel = checkbox(formData.get('needsOwnerLabel'));
  const translations = (['en','ar'] as const).map((locale) => ({
    locale,
    name: requiredText(formData, locale + 'Name'),
    description: optionalText(formData.get(locale + 'Description'))
  }));
  if (enabled) {
    const gate = validatePublishable('capability', {
      translations,
      unresolvedPremiumEnglishLabel: needsOwnerLabel
    });
    if (!gate.ok) throw new Error('Capability package blocked: ' + gate.missing.join(', '));
  }
  const data = {
    key: slug.parse(formData.get('key')),
    sortOrder: integer(formData.get('sortOrder')),
    enabled,
    needsOwnerLabel
  };
  const row = rowId
    ? await db.capabilityPackage.update({ where: { id: rowId }, data })
    : await db.capabilityPackage.create({ data });

  for (const copy of translations) {
    await db.capabilityPackageTranslation.upsert({
      where: { capabilityPackageId_locale: { capabilityPackageId: row.id, locale: copy.locale } },
      create: { capabilityPackageId: row.id, ...copy },
      update: copy
    });
  }
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'CapabilityPackage', row.id);
  revalidatePath('/admin/capabilities');
}

export async function saveCapabilityFeature(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const data = {
    key: slug.parse(formData.get('key')),
    sortOrder: integer(formData.get('sortOrder')),
    enabled: checkbox(formData.get('enabled'))
  };
  const row = rowId
    ? await db.capabilityFeature.update({ where: { id: rowId }, data })
    : await db.capabilityFeature.create({ data });

  for (const locale of ['en','ar'] as const) {
    const name = requiredText(formData, locale + 'Name');
    const description = optionalText(formData.get(locale + 'Description'));
    await db.capabilityFeatureTranslation.upsert({
      where: { capabilityFeatureId_locale: { capabilityFeatureId: row.id, locale } },
      create: { capabilityFeatureId: row.id, locale, name, description },
      update: { name, description }
    });
  }
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'CapabilityFeature', row.id);
  revalidatePath('/admin/capabilities');
}

export async function saveCapabilityValue(formData: FormData) {
  await requireAdmin();
  const packageId = id.parse(formData.get('packageId'));
  const featureId = id.parse(formData.get('featureId'));
  const valueKind = z.enum(['TEXT','BOOLEAN','NONE']).parse(formData.get('valueKind'));
  const enabled = checkbox(formData.get('enabled'));
  const booleanValue = valueKind === 'BOOLEAN' ? checkbox(formData.get('booleanValue')) : null;
  const row = await db.capabilityValue.upsert({
    where: { capabilityPackageId_capabilityFeatureId: { capabilityPackageId: packageId, capabilityFeatureId: featureId } },
    update: { valueKind, booleanValue, enabled },
    create: { capabilityPackageId: packageId, capabilityFeatureId: featureId, valueKind, booleanValue, enabled }
  });
  for (const locale of ['en','ar'] as const) {
    const content = valueKind === 'TEXT' ? requiredText(formData, locale + 'Content', 4000) : null;
    await db.capabilityValueTranslation.upsert({
      where: { capabilityValueId_locale: { capabilityValueId: row.id, locale } },
      create: { capabilityValueId: row.id, locale, content },
      update: { content }
    });
  }
  await auditAdmin('UPSERT', 'CapabilityValue', row.id);
  revalidatePath('/admin/capabilities');
}

export async function updateInquiryStatus(formData: FormData) {
  await requireAdmin();
  const rowId = id.parse(formData.get('id'));
  const status = z.enum(['NEW','READ','IN_PROGRESS','CLOSED','SPAM']).parse(formData.get('status'));
  await db.contactSubmission.update({ where: { id: rowId }, data: { status } });
  await auditAdmin('STATUS_CHANGE', 'ContactSubmission', rowId, { status });
  revalidatePath('/admin/inquiries');
}

export async function saveSeo(formData: FormData) {
  await requireAdmin();
  const ownerType = z.enum(['Page','Service','Project']).parse(formData.get('ownerType'));
  const ownerId = id.parse(formData.get('ownerId'));
  const locale = z.enum(['en','ar']).parse(formData.get('locale'));
  const canonicalOverride = optionalText(formData.get('canonicalOverride'));
  if (canonicalOverride && !isSafeHttpUrl(canonicalOverride)) throw new Error('Canonical override must be an absolute HTTP(S) URL.');
  const data = {
    title: requiredText(formData, 'title'),
    description: requiredText(formData, 'description', 3000),
    canonicalOverride,
    robots: requiredText(formData, 'robots', 100),
    ogTitle: optionalText(formData.get('ogTitle')),
    ogDescription: optionalText(formData.get('ogDescription')),
    ogImageId: optionalText(formData.get('ogImageId'))
  };
  await db.seoMetadata.upsert({
    where: { ownerType_ownerId_locale: { ownerType, ownerId, locale } },
    create: { ownerType, ownerId, locale, ...data },
    update: data
  });
  await auditAdmin('UPSERT', 'SeoMetadata', ownerId, { ownerType, locale });
  revalidatePath('/admin/seo');
}

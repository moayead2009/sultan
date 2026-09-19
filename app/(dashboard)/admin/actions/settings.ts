'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, integer, optionalText } from '@/lib/admin-input';
import { isSafeHttpOrRelativeUrl } from '@/lib/security-url';
import { replaceMediaUsage } from '@/lib/media-usage';

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const websiteUrl = optionalText(formData.get('websiteUrl'));
  const mapUrl = optionalText(formData.get('mapUrl'));
  if (websiteUrl && !isSafeHttpOrRelativeUrl(websiteUrl)) throw new Error('Website URL must be HTTP(S).');
  if (mapUrl && !isSafeHttpOrRelativeUrl(mapUrl)) throw new Error('Map URL must be HTTP(S).');

  const primaryLogoId = optionalText(formData.get('primaryLogoId'));
  const alternateLogoId = optionalText(formData.get('alternateLogoId'));
  const faviconId = optionalText(formData.get('faviconId'));
  const defaultOgImageId = optionalText(formData.get('defaultOgImageId'));
  const retentionRaw = optionalText(formData.get('inquiryRetentionDays'));
  const inquiryRetentionDays = retentionRaw ? z.coerce.number().int().positive().max(3650).parse(retentionRaw) : null;

  const data = {
    defaultLocale: formData.get('defaultLocale') === 'en' ? ('en' as const) : ('ar' as const),
    brandNameEnglish: optionalText(formData.get('brandNameEnglish')),
    brandNameArabic: optionalText(formData.get('brandNameArabic')),
    websiteUrl,
    primaryLogoId,
    alternateLogoId,
    faviconId,
    defaultOgImageId,
    contactPhonePrimary: optionalText(formData.get('contactPhonePrimary')),
    contactPhoneSecondary: optionalText(formData.get('contactPhoneSecondary')),
    contactEmail: optionalText(formData.get('contactEmail')),
    addressLine1: optionalText(formData.get('addressLine1')),
    addressLine2: optionalText(formData.get('addressLine2')),
    city: optionalText(formData.get('city')),
    region: optionalText(formData.get('region')),
    country: optionalText(formData.get('country')),
    postalCode: optionalText(formData.get('postalCode')),
    mapUrl,
    copyrightEnglish: optionalText(formData.get('copyrightEnglish')),
    copyrightArabic: optionalText(formData.get('copyrightArabic')),
    contactFormEnabled: checkbox(formData.get('contactFormEnabled')),
    inquiryRecipient: optionalText(formData.get('inquiryRecipient')),
    inquiryRetentionDays,
    inquiryFormNoticeEn: optionalText(formData.get('inquiryFormNoticeEn')),
    inquiryFormNoticeAr: optionalText(formData.get('inquiryFormNoticeAr'))
  };

  await db.$transaction(async (tx) => {
    await tx.siteSettings.upsert({ where: { id: 'site' }, create: { id: 'site', ...data }, update: data });
    const usages = [];
    if (primaryLogoId) usages.push({ mediaAssetId: primaryLogoId, usageRole: 'primaryLogo' });
    if (alternateLogoId) usages.push({ mediaAssetId: alternateLogoId, usageRole: 'alternateLogo' });
    if (faviconId) usages.push({ mediaAssetId: faviconId, usageRole: 'favicon' });
    if (defaultOgImageId) usages.push({ mediaAssetId: defaultOgImageId, usageRole: 'defaultOgImage' });
    await replaceMediaUsage(tx, 'SiteSettings', 'site', usages, true);
  });
  await auditAdmin('UPDATE', 'SiteSettings', 'site');
  revalidatePath('/admin/site-settings');
}

export async function saveSocialLink(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const url = z.string().url().parse(formData.get('url'));
  const data = {
    platform: z.string().trim().min(1).max(80).parse(formData.get('platform')),
    url,
    sortOrder: integer(formData.get('sortOrder')),
    enabled: checkbox(formData.get('enabled'))
  };
  const row = rowId ? await db.socialLink.update({ where: { id: rowId }, data }) : await db.socialLink.create({ data });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'SocialLink', row.id);
  revalidatePath('/admin/site-settings');
}

export async function deleteSocialLink(formData: FormData) {
  await requireAdmin(['OWNER']);
  const rowId = z.string().min(1).parse(formData.get('id'));
  await db.socialLink.delete({ where: { id: rowId } });
  await auditAdmin('DELETE', 'SocialLink', rowId);
  revalidatePath('/admin/site-settings');
}

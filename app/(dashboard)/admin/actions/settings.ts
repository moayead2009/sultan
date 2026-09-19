'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, optionalText } from '@/lib/admin-input';
import { isSafeHttpOrRelativeUrl } from '@/lib/security-url';

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const websiteUrl = optionalText(formData.get('websiteUrl'));
  if (websiteUrl && !isSafeHttpOrRelativeUrl(websiteUrl)) {
    throw new Error('Website URL must be an HTTP(S) URL.');
  }

  const data = {
    defaultLocale: formData.get('defaultLocale') === 'en' ? ('en' as const) : ('ar' as const),
    brandNameEnglish: optionalText(formData.get('brandNameEnglish')),
    brandNameArabic: optionalText(formData.get('brandNameArabic')),
    websiteUrl,
    contactPhonePrimary: optionalText(formData.get('contactPhonePrimary')),
    contactPhoneSecondary: optionalText(formData.get('contactPhoneSecondary')),
    contactEmail: optionalText(formData.get('contactEmail')),
    addressLine1: optionalText(formData.get('addressLine1')),
    contactFormEnabled: checkbox(formData.get('contactFormEnabled'))
  };

  await db.siteSettings.upsert({
    where: { id: 'site' },
    create: { id: 'site', ...data },
    update: data
  });
  await auditAdmin('UPDATE', 'SiteSettings', 'site');
  revalidatePath('/admin/site-settings');
}

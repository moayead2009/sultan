'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { assertSectionAllowed, parseSectionSettings } from '@/lib/section-schemas';
import { validatePublishable } from '@/lib/publication';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const localeText = z.string().trim().max(5000);

async function audit(action: string, entityType: string, entityId?: string, metadataJson?: object) {
  const session = await requireAdmin();
  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action,
      entityType,
      entityId,
      metadataJson: metadataJson ?? undefined
    }
  });
}

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const defaultLocale = formData.get('defaultLocale') === 'en' ? 'en' : 'ar';
  const contactEmail = String(formData.get('contactEmail') ?? '').trim() || null;
  const addressLine1 = String(formData.get('addressLine1') ?? '').trim() || null;
  const contactFormEnabled = formData.get('contactFormEnabled') === 'on';

  await db.siteSettings.upsert({
    where: { id: 'site' },
    update: {
      defaultLocale,
      brandNameEnglish: String(formData.get('brandNameEnglish') ?? '').trim() || null,
      brandNameArabic: String(formData.get('brandNameArabic') ?? '').trim() || null,
      websiteUrl: String(formData.get('websiteUrl') ?? '').trim() || null,
      contactPhonePrimary: String(formData.get('contactPhonePrimary') ?? '').trim() || null,
      contactPhoneSecondary: String(formData.get('contactPhoneSecondary') ?? '').trim() || null,
      contactEmail,
      addressLine1,
      contactFormEnabled
    },
    create: {
      id: 'site',
      defaultLocale,
      brandNameEnglish: String(formData.get('brandNameEnglish') ?? '').trim() || null,
      brandNameArabic: String(formData.get('brandNameArabic') ?? '').trim() || null,
      websiteUrl: String(formData.get('websiteUrl') ?? '').trim() || null,
      contactPhonePrimary: String(formData.get('contactPhonePrimary') ?? '').trim() || null,
      contactPhoneSecondary: String(formData.get('contactPhoneSecondary') ?? '').trim() || null,
      contactEmail,
      addressLine1,
      contactFormEnabled
    }
  });
  await audit('UPDATE', 'SiteSettings', 'site');
  revalidatePath('/admin/site-settings');
}

export async function createPage(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    slug,
    template: z.enum(['home', 'about', 'services', 'service', 'projects', 'project', 'capabilities', 'clients', 'contact', 'legal']),
    enTitle: localeText.min(1),
    arTitle: localeText.min(1)
  }).parse({
    slug: formData.get('slug'),
    template: formData.get('template'),
    enTitle: formData.get('enTitle'),
    arTitle: formData.get('arTitle')
  });

  const page = await db.page.create({
    data: {
      slug: parsed.slug,
      template: parsed.template,
      translations: {
        create: [
          { locale: 'en', title: parsed.enTitle, navigationLabel: parsed.enTitle },
          { locale: 'ar', title: parsed.arTitle, navigationLabel: parsed.arTitle }
        ]
      }
    }
  });
  await audit('CREATE', 'Page', page.id);
  revalidatePath('/admin/pages');
}

export async function updatePageTranslation(formData: FormData) {
  await requireAdmin();
  const pageId = z.string().min(1).parse(formData.get('pageId'));
  const locale = z.enum(['en', 'ar']).parse(formData.get('locale'));
  const title = localeText.min(1).parse(formData.get('title'));
  const summary = localeText.parse(formData.get('summary') ?? '');

  await db.pageTranslation.upsert({
    where: { pageId_locale: { pageId, locale } },
    update: { title, summary: summary || null },
    create: { pageId, locale, title, summary: summary || null }
  });
  await audit('UPDATE_TRANSLATION', 'Page', pageId, { locale });
  revalidatePath('/admin/pages');
}

export async function createSection(formData: FormData) {
  await requireAdmin();
  const pageId = z.string().min(1).parse(formData.get('pageId'));
  const page = await db.page.findUniqueOrThrow({ where: { id: pageId } });
  const key = slug.parse(formData.get('key'));
  const sectionType = z.string().min(1).parse(formData.get('sectionType'));
  assertSectionAllowed(page.template as Parameters<typeof assertSectionAllowed>[0], sectionType);
  const settings = JSON.parse(String(formData.get('settingsJson') || '{}')) as unknown;
  parseSectionSettings(sectionType, 1, settings);

  const section = await db.pageSection.create({
    data: {
      pageId,
      key,
      sectionType,
      settingsVersion: 1,
      settingsJson: JSON.parse(JSON.stringify(settings)),
      sortOrder: Number(formData.get('sortOrder') ?? 0),
      translations: {
        create: [
          { locale: 'en', title: String(formData.get('enTitle') ?? '').trim() || null },
          { locale: 'ar', title: String(formData.get('arTitle') ?? '').trim() || null }
        ]
      }
    }
  });
  await audit('CREATE', 'PageSection', section.id, { pageId });
  revalidatePath('/admin/sections');
}

export async function toggleSection(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const section = await db.pageSection.findUniqueOrThrow({ where: { id } });
  await db.pageSection.update({ where: { id }, data: { enabled: !section.enabled } });
  await audit('TOGGLE', 'PageSection', id, { enabled: !section.enabled });
  revalidatePath('/admin/sections');
}

export async function publishPage(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const page = await db.page.findUniqueOrThrow({
    where: { id },
    include: {
      translations: true,
      sections: { include: { translations: true } }
    }
  });

  const enabledSectionsComplete = page.sections
    .filter((section) => section.enabled)
    .every((section) => {
      const en = section.translations.find((row) => row.locale === 'en');
      const ar = section.translations.find((row) => row.locale === 'ar');
      return Boolean(en && ar);
    });

  const gate = validatePublishable('page', {
    translations: page.translations,
    enabledSectionsComplete
  });
  if (!gate.ok) {
    throw new Error('Publication blocked. Missing: ' + gate.missing.join(', '));
  }

  await db.page.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() }
  });
  await audit('PUBLISH', 'Page', id);
  revalidatePath('/admin/pages');
}

export async function unpublishPage(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  await db.page.update({ where: { id }, data: { status: 'DRAFT', publishedAt: null } });
  await audit('UNPUBLISH', 'Page', id);
  revalidatePath('/admin/pages');
}

export async function createRedirect(formData: FormData) {
  await requireAdmin();
  const fromPath = z.string().startsWith('/').max(500).parse(formData.get('fromPath'));
  const toPath = z.string().startsWith('/').max(500).parse(formData.get('toPath'));
  if (fromPath === toPath) throw new Error('Redirect cannot point to itself.');
  await db.redirect.create({ data: { fromPath, toPath, permanent: true, enabled: true } });
  await audit('CREATE', 'Redirect');
  revalidatePath('/admin/redirects');
}

export async function createContactPerson(formData: FormData) {
  await requireAdmin();
  const enName = localeText.min(1).parse(formData.get('enName'));
  const arName = localeText.min(1).parse(formData.get('arName'));
  const person = await db.contactPerson.create({
    data: {
      phone: String(formData.get('phone') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
      organization: String(formData.get('organization') ?? '').trim() || null,
      enabled: formData.get('enabled') === 'on',
      translations: {
        create: [
          { locale: 'en', name: enName, title: String(formData.get('enTitle') ?? '').trim() || null },
          { locale: 'ar', name: arName, title: String(formData.get('arTitle') ?? '').trim() || null }
        ]
      }
    }
  });
  await audit('CREATE', 'ContactPerson', person.id);
  revalidatePath('/admin/contact-people');
}

export async function createUser(formData: FormData) {
  const session = await requireAdmin(['OWNER']);
  const { hash } = await import('@node-rs/argon2');
  const password = z.string().min(12).max(128).parse(formData.get('password'));
  const email = z.string().email().transform((value) => value.toLowerCase()).parse(formData.get('email'));
  const passwordHash = await hash(password);
  const user = await db.user.create({
    data: {
      name: z.string().min(1).max(100).parse(formData.get('name')),
      email,
      passwordHash,
      role: formData.get('role') === 'OWNER' ? 'OWNER' : 'ADMIN'
    }
  });
  await db.auditLog.create({
    data: { actorUserId: session.user.id, action: 'CREATE', entityType: 'User', entityId: user.id }
  });
  revalidatePath('/admin/users');
}

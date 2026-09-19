import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import type { Locale } from '@/lib/i18n';

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export function localizedUrls(baseUrl: string, slug: string, locale: Locale, defaultLocale: Locale) {
  const base = cleanBaseUrl(baseUrl);
  const suffix = slug === 'home' ? '' : `/${slug}`;
  const forLocale = (target: Locale) => `${base}/${target}${suffix}`;
  return {
    canonical: forLocale(locale),
    languages: {
      en: forLocale('en'),
      ar: forLocale('ar'),
      'x-default': forLocale(defaultLocale)
    }
  };
}

async function metadataCore(ownerType: string, ownerId: string, routeSlug: string, locale: Locale, fallbackTitle: string, fallbackDescription?: string | null) {
  const settings = await db.siteSettings.findUnique({ where: { id: 'site' }, include: { defaultOgImage: true } });
  const seo = await db.seoMetadata.findUnique({
    where: { ownerType_ownerId_locale: { ownerType, ownerId, locale } },
    include: { ogImage: true }
  });
  const baseUrl = settings?.websiteUrl || env.APP_URL;
  const defaultLocale = settings?.defaultLocale === 'en' ? 'en' : 'ar';
  const alternates = localizedUrls(baseUrl, routeSlug, locale, defaultLocale);
  const title = seo?.title || fallbackTitle;
  const description = seo?.description || fallbackDescription || undefined;
  const robots = seo?.robots || 'index,follow';
  const ogImage = seo?.ogImage || settings?.defaultOgImage;
  const ogImageUrl = ogImage
    ? (ogImage.publicUrl.startsWith('http') ? ogImage.publicUrl : new URL(ogImage.publicUrl, baseUrl).toString())
    : undefined;
  return {
    title,
    description,
    alternates: seo?.canonicalOverride ? { ...alternates, canonical: seo.canonicalOverride } : alternates,
    robots: { index: !robots.includes('noindex'), follow: !robots.includes('nofollow') },
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url: seo?.canonicalOverride || alternates.canonical,
      images: ogImage && ogImageUrl ? [{ url: ogImageUrl, width: ogImage.width || undefined, height: ogImage.height || undefined }] : undefined
    }
  } satisfies Metadata;
}

export async function buildPageMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug }, include: { translations: true } });
  if (!page) return {};
  const translation = page.translations.find((row) => row.locale === locale);
  if (!translation) return {};
  return metadataCore('Page', page.id, slug, locale, translation.title, translation.summary);
}

export async function buildServiceMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const service = await db.service.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { translations: true } });
  if (!service) return {};
  const translation = service.translations.find((row) => row.locale === locale) ?? service.translations[0];
  if (!translation) return {};
  return metadataCore('Service', service.id, `services/${slug}`, locale, translation.name, translation.shortDescription);
}

export async function buildProjectMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const project = await db.project.findFirst({ where: { slug, status: 'PUBLISHED' }, include: { translations: true } });
  if (!project) return {};
  const translation = project.translations.find((row) => row.locale === locale) ?? project.translations[0];
  if (!translation) return {};
  return metadataCore('Project', project.id, `projects/${slug}`, locale, translation.title, translation.summary);
}

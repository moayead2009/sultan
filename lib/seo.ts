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

export async function buildPageMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const [settings, page] = await Promise.all([
    db.siteSettings.findUnique({ where: { id: 'site' } }),
    db.page.findUnique({
      where: { slug },
      include: { translations: true }
    })
  ]);
  if (!page) return {};
  const translation = page.translations.find((row) => row.locale === locale);
  if (!translation) return {};
  const seo = await db.seoMetadata.findUnique({
    where: { ownerType_ownerId_locale: { ownerType: 'Page', ownerId: page.id, locale } }
  });
  const baseUrl = settings?.websiteUrl || env.APP_URL;
  const defaultLocale = settings?.defaultLocale === 'en' ? 'en' : 'ar';
  const alternates = localizedUrls(baseUrl, slug, locale, defaultLocale);
  const title = seo?.title || translation.title;
  const description = seo?.description || translation.summary || undefined;
  const robots = seo?.robots || 'index,follow';
  return {
    title,
    description,
    alternates,
    robots: {
      index: !robots.includes('noindex'),
      follow: !robots.includes('nofollow')
    },
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url: alternates.canonical
    }
  };
}

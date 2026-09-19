import type { Locale } from '@/lib/i18n';
import type { getPublicEntities, getPublicPage, getSiteChrome } from '@/lib/public-site';
import { Breadcrumbs, SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { SectionRenderer } from '@/components/public/section-renderer';
import { JsonLd, breadcrumbStructuredData, siteStructuredData } from '@/components/public/json-ld';
import { env } from '@/lib/env';

export function PublicPage({
  locale,
  page,
  entities,
  chrome,
  breadcrumbs = []
}: {
  locale: Locale;
  page: NonNullable<Awaited<ReturnType<typeof getPublicPage>>>;
  entities: Awaited<ReturnType<typeof getPublicEntities>>;
  chrome: Awaited<ReturnType<typeof getSiteChrome>>;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  const baseUrl = chrome.settings?.websiteUrl || env.APP_URL;
  return <>
    <JsonLd data={siteStructuredData({
      baseUrl,
      brandEnglish: chrome.settings?.brandNameEnglish,
      brandArabic: chrome.settings?.brandNameArabic,
      logoUrl: chrome.settings?.primaryLogo?.publicUrl
    })} />
    {breadcrumbs.length ? <JsonLd data={breadcrumbStructuredData(baseUrl, locale, breadcrumbs)} /> : null}
    <SiteHeader data={chrome} />
    {breadcrumbs.length ? <Breadcrumbs locale={locale} items={breadcrumbs} /> : null}
    <main>
      {page.sections.map((section) => <SectionRenderer key={section.id} section={section} locale={locale} entities={entities} contactFormEnabled={chrome.settings?.contactFormEnabled ?? false} contactFormNotice={locale === 'ar' ? chrome.settings?.inquiryFormNoticeAr : chrome.settings?.inquiryFormNoticeEn} />)}
    </main>
    <SiteFooter data={chrome} />
  </>;
}

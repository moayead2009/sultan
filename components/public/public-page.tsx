import type { Locale } from '@/lib/i18n';
import type { getPublicEntities, getPublicPage, getSiteChrome } from '@/lib/public-site';
import { localized } from '@/lib/public-site';
import { Breadcrumbs, SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { SectionRenderer } from '@/components/public/section-renderer';
import { JsonLd } from '@/components/public/json-ld';
import { breadcrumbStructuredData, siteStructuredData } from '@/lib/structured-data';
import { env } from '@/lib/env';

export function PublicPage({
  locale,
  page,
  entities,
  chrome,
  breadcrumbs = [],
  activeProjectCategory
}: {
  locale: Locale;
  page: NonNullable<Awaited<ReturnType<typeof getPublicPage>>>;
  entities: Awaited<ReturnType<typeof getPublicEntities>>;
  chrome: Awaited<ReturnType<typeof getSiteChrome>>;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  activeProjectCategory?: string;
}) {
  const baseUrl = chrome.settings?.websiteUrl || env.APP_URL;
  const hasLocalizedHeroHeading = page.sections.some((section) => {
    if (section.sectionType !== 'hero') return false;
    return Boolean(localized(section.translations, locale)?.title?.trim());
  });
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
    <main id="main-content">
      {!hasLocalizedHeroHeading && page.translation?.title?.trim() ? <header className="page-title-section">
        <div className="container-shell narrow">
          <h1>{page.translation.title}</h1>
          {page.translation.summary ? <p>{page.translation.summary}</p> : null}
        </div>
      </header> : null}
      {page.sections.map((section) => <SectionRenderer key={section.id} section={section} locale={locale} entities={entities} activeProjectCategory={activeProjectCategory} contactFormEnabled={chrome.settings?.contactFormEnabled ?? false} contactFormNotice={locale === 'ar' ? chrome.settings?.inquiryFormNoticeAr : chrome.settings?.inquiryFormNoticeEn} />)}
    </main>
    <SiteFooter data={chrome} />
  </>;
}

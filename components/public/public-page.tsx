import type { Locale } from '@/lib/i18n';
import type { getPublicEntities, getPublicPage, getSiteChrome } from '@/lib/public-site';
import { Breadcrumbs, SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { SectionRenderer } from '@/components/public/section-renderer';

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
  return <>
    <SiteHeader data={chrome} />
    {breadcrumbs.length ? <Breadcrumbs locale={locale} items={breadcrumbs} /> : null}
    <main>
      {page.sections.map((section) => <SectionRenderer key={section.id} section={section} locale={locale} entities={entities} />)}
    </main>
    <SiteFooter data={chrome} />
  </>;
}

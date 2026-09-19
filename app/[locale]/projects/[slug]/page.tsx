import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs, SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { PublicImage } from '@/components/public/media';
import { buildProjectMetadata } from '@/lib/seo';
import { getProject, getSiteChrome } from '@/lib/public-site';
import { isLocale } from '@/lib/i18n';
import { JsonLd, breadcrumbStructuredData, siteStructuredData } from '@/components/public/json-ld';
import { env } from '@/lib/env';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  return buildProjectMetadata(slug, locale);
}

export default async function ProjectDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [project, chrome] = await Promise.all([getProject(slug, locale), getSiteChrome(locale)]);
  if (!project) notFound();
  const breadcrumbs = [{ label: locale === 'ar' ? 'المشاريع' : 'Projects', href: `/${locale}/projects` }, { label: project.translation?.title || project.slug }];
  const baseUrl = chrome.settings?.websiteUrl || env.APP_URL;
  return <>
    <JsonLd data={siteStructuredData({ baseUrl, brandEnglish: chrome.settings?.brandNameEnglish, brandArabic: chrome.settings?.brandNameArabic, logoUrl: chrome.settings?.primaryLogo?.publicUrl })} />
    <JsonLd data={breadcrumbStructuredData(baseUrl, locale, breadcrumbs)} />
    <SiteHeader data={chrome} />
    <Breadcrumbs locale={locale} items={breadcrumbs} />
    <main id="main-content">
      <section className="detail-hero"><div className="container-shell detail-hero__grid"><div>
        {project.categoryTranslation?.name ? <p className="eyebrow">{project.categoryTranslation.name}</p> : null}
        <h1>{project.translation?.title}</h1><p>{project.translation?.summary}</p>
        <div className="project-facts">{project.year ? <span>{project.year}</span> : null}{project.location ? <span>{project.location}</span> : null}{project.clientTranslation?.name ? <span>{project.clientTranslation.name}</span> : null}</div>
      </div>{project.coverMedia ? <PublicImage asset={project.coverMedia} locale={locale} className="detail-hero__image" sizes="(max-width: 980px) 100vw, 42vw" eager /> : <div className="geometric-art detail-art" aria-hidden="true"><span/><span/><span/></div>}</div></section>
      {project.translation?.detailedDescription ? <section className="public-section"><div className="container-shell narrow"><p className="rich-copy">{project.translation.detailedDescription}</p></div></section> : null}
      {project.media.length ? <section className="public-section"><div className="container-shell"><div className="gallery-grid">{project.media.map((entry) => <PublicImage key={entry.id} asset={entry.media} locale={locale} />)}</div></div></section> : null}
      {project.localizedServices.length ? <section className="public-section soft-section"><div className="container-shell"><h2>{locale === 'ar' ? 'الخدمات ذات الصلة' : 'Related services'}</h2><div className="card-grid">{project.localizedServices.map((service) => <Link className="service-card" key={service.id} href={`/${locale}/services/${service.slug}`}><h3>{service.translation?.name}</h3><p>{service.translation?.shortDescription}</p></Link>)}</div></div></section> : null}
    </main>
    <SiteFooter data={chrome} />
  </>;
}

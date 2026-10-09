import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/public/json-ld';
import { PublicImage } from '@/components/public/media';
import { Breadcrumbs, SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { env } from '@/lib/env';
import { isLocale } from '@/lib/i18n';
import { getProject, getSiteChrome } from '@/lib/public-site';
import { buildProjectMetadata } from '@/lib/seo';
import { breadcrumbStructuredData, siteStructuredData } from '@/lib/structured-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  return buildProjectMetadata(slug, locale);
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const [project, chrome] = await Promise.all([getProject(slug, locale), getSiteChrome(locale)]);
  if (!project) notFound();

  const labels =
    locale === 'ar'
      ? {
          projects: 'المشاريع',
          sector: 'التصنيف',
          client: 'العميل',
          location: 'المكان',
          year: 'السنة',
          services: 'الخدمات',
          overview: 'عن المشروع',
          challenge: 'التحدي',
          solution: 'الحل',
          results: 'النتائج',
          galleryEyebrow: 'تفاصيل من التنفيذ',
          gallery: 'معرض المشروع',
          relatedServices: 'الخدمات ذات الصلة',
          previous: 'المشروع السابق',
          next: 'المشروع التالي',
        }
      : {
          projects: 'Projects',
          sector: 'Sector',
          client: 'Client',
          location: 'Location',
          year: 'Year',
          services: 'Services',
          overview: 'Project overview',
          challenge: 'Challenge',
          solution: 'Solution',
          results: 'Results',
          galleryEyebrow: 'Execution details',
          gallery: 'Project gallery',
          relatedServices: 'Related services',
          previous: 'Previous project',
          next: 'Next project',
        };

  const breadcrumbs = [
    { label: labels.projects, href: `/${locale}/projects` },
    { label: project.translation?.title || project.slug },
  ];
  const baseUrl = chrome.settings?.websiteUrl || env.APP_URL;
  const facts = [
    { label: labels.sector, value: project.categoryTranslation?.name },
    { label: labels.client, value: project.clientTranslation?.name },
    { label: labels.location, value: project.location },
    { label: labels.year, value: project.year ? String(project.year) : null },
  ].filter((fact) => fact.value);
  const hasStory = Boolean(
    project.translation?.detailedDescription ||
    project.translation?.challenge ||
    project.translation?.solution ||
    project.translation?.results,
  );

  return (
    <>
      <JsonLd
        data={siteStructuredData({
          baseUrl,
          brandEnglish: chrome.settings?.brandNameEnglish,
          brandArabic: chrome.settings?.brandNameArabic,
          logoUrl: chrome.settings?.primaryLogo?.publicUrl,
        })}
      />
      <JsonLd data={breadcrumbStructuredData(baseUrl, locale, breadcrumbs)} />
      <SiteHeader data={chrome} />
      <Breadcrumbs locale={locale} items={breadcrumbs} />

      <main id="main-content" className="project-case-study">
        <section className="project-showcase-hero">
          <div className="project-showcase-hero__media" aria-hidden={!project.coverMedia}>
            {project.coverMedia ? (
              <PublicImage
                asset={project.coverMedia}
                locale={locale}
                className="project-showcase-hero__image"
                sizes="100vw"
                eager
              />
            ) : (
              <div className="project-showcase-hero__fallback" aria-hidden="true" />
            )}
            <div className="project-showcase-hero__scrim" aria-hidden="true" />
          </div>
          <div className="container-shell project-showcase-hero__content">
            {project.categoryTranslation?.name ? (
              <p className="project-showcase-hero__eyebrow">{project.categoryTranslation.name}</p>
            ) : null}
            <h1>{project.translation?.title}</h1>
            {project.translation?.summary ? (
              <p className="project-showcase-hero__summary">{project.translation.summary}</p>
            ) : null}
          </div>
        </section>

        {facts.length || project.localizedServices.length ? (
          <section
            className="project-meta-band"
            aria-label={locale === 'ar' ? 'تفاصيل المشروع' : 'Project details'}
          >
            <div className="container-shell project-meta-grid">
              {facts.map((fact) => (
                <div className="project-meta-item" key={fact.label}>
                  <span>{fact.label}</span>
                  <strong dir={fact.label === labels.year ? 'ltr' : undefined}>{fact.value}</strong>
                </div>
              ))}
              {project.localizedServices.length ? (
                <div className="project-meta-item project-meta-item--services">
                  <span>{labels.services}</span>
                  <div className="project-meta-services">
                    {project.localizedServices.map((service) => (
                      <Link href={`/${locale}/services/${service.slug}`} key={service.id}>
                        {service.translation?.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {hasStory ? (
          <section className="public-section project-story-section">
            <div className="container-shell project-story-layout">
              {project.translation?.detailedDescription ? (
                <div className="project-story-intro">
                  <p className="eyebrow">{labels.overview}</p>
                  <p className="project-story-lead">{project.translation.detailedDescription}</p>
                </div>
              ) : null}
              {project.translation?.challenge ||
              project.translation?.solution ||
              project.translation?.results ? (
                <div className="project-story-grid">
                  {project.translation?.challenge ? (
                    <article>
                      <span>01</span>
                      <h2>{labels.challenge}</h2>
                      <p>{project.translation.challenge}</p>
                    </article>
                  ) : null}
                  {project.translation?.solution ? (
                    <article>
                      <span>02</span>
                      <h2>{labels.solution}</h2>
                      <p>{project.translation.solution}</p>
                    </article>
                  ) : null}
                  {project.translation?.results ? (
                    <article>
                      <span>03</span>
                      <h2>{labels.results}</h2>
                      <p>{project.translation.results}</p>
                    </article>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {project.videoMedia ? (
          <section className="public-section project-video-section">
            <div className="container-shell">
              <video
                className="project-video"
                controls
                playsInline
                preload="metadata"
                poster={project.coverMedia?.publicUrl}
              >
                <source src={project.videoMedia.publicUrl} />
              </video>
            </div>
          </section>
        ) : null}

        {project.media.length ? (
          <section className="public-section project-gallery-section">
            <div className="container-shell">
              <div className="project-gallery-heading">
                <p className="eyebrow">{labels.galleryEyebrow}</p>
                <h2>{labels.gallery}</h2>
              </div>
              <div className="project-gallery-grid">
                {project.media.map((entry, index) => (
                  <figure className="project-gallery-item" key={entry.id}>
                    <PublicImage
                      asset={entry.media}
                      locale={locale}
                      sizes={index % 3 === 0 ? '100vw' : '(max-width: 760px) 100vw, 50vw'}
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {project.localizedServices.length ? (
          <section className="public-section project-related-services">
            <div className="container-shell">
              <p className="eyebrow">{labels.relatedServices}</p>
              <div className="project-service-links">
                {project.localizedServices.map((service) => (
                  <Link key={service.id} href={`/${locale}/services/${service.slug}`}>
                    <span>{service.translation?.name}</span>
                    <b aria-hidden="true">↗</b>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {project.previousProject || project.nextProject ? (
          <nav
            className="project-pagination container-shell"
            aria-label={locale === 'ar' ? 'التنقل بين المشاريع' : 'Project navigation'}
          >
            {project.previousProject ? (
              <Link
                className="project-pagination__item"
                href={`/${locale}/projects/${project.previousProject.slug}`}
              >
                <small>{labels.previous}</small>
                <strong>{project.previousProject.translation?.title}</strong>
              </Link>
            ) : (
              <span />
            )}
            {project.nextProject ? (
              <Link
                className="project-pagination__item project-pagination__item--next"
                href={`/${locale}/projects/${project.nextProject.slug}`}
              >
                <small>{labels.next}</small>
                <strong>{project.nextProject.translation?.title}</strong>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </main>

      <SiteFooter data={chrome} />
    </>
  );
}

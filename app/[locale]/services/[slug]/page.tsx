import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs, SiteFooter, SiteHeader } from '@/components/public/site-shell';
import { PublicImage } from '@/components/public/media';
import { buildServiceMetadata } from '@/lib/seo';
import { getService, getSiteChrome } from '@/lib/public-site';
import { isLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  return buildServiceMetadata(slug, locale);
}

export default async function ServiceDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [service, chrome] = await Promise.all([getService(slug, locale), getSiteChrome(locale)]);
  if (!service) notFound();
  return <>
    <SiteHeader data={chrome} />
    <Breadcrumbs locale={locale} items={[
      { label: locale === 'ar' ? 'الخدمات' : 'Services', href: `/${locale}/services` },
      { label: service.translation?.name || service.slug }
    ]} />
    <main>
      <section className="detail-hero"><div className="container-shell detail-hero__grid"><div>
        <p className="eyebrow">{service.categoryTranslation?.name}</p>
        <h1>{service.translation?.name}</h1>
        <p>{service.translation?.shortDescription}</p>
        {service.primaryCtaUrl && service.translation?.ctaLabel ? <Link className="button" href={service.primaryCtaUrl}>{service.translation.ctaLabel}</Link> : <Link className="button" href={`/${locale}/contact`}>{locale === 'ar' ? 'تواصل معنا' : 'Discuss your project'}</Link>}
      </div>{service.coverMedia ? <PublicImage asset={service.coverMedia} locale={locale} className="detail-hero__image" /> : <div className="geometric-art detail-art" aria-hidden="true"><span/><span/><span/></div>}</div></section>
      <section className="public-section"><div className="container-shell narrow"><div className="rich-copy">{service.translation?.detailedContent}</div></div></section>
      {service.localizedFeatures.length ? <section className="public-section soft-section"><div className="container-shell"><h2>{locale === 'ar' ? 'مزايا وخدمات مرتبطة' : 'Features & delivery scope'}</h2><div className="card-grid">{service.localizedFeatures.map((feature) => <article className="premium-card" key={feature.id}><h3>{feature.translation?.title}</h3>{feature.translation?.description ? <p>{feature.translation.description}</p> : null}</article>)}</div></div></section> : null}
      {service.localizedChildren.length ? <section className="public-section"><div className="container-shell"><h2>{locale === 'ar' ? 'خدمات فرعية' : 'Sub-services'}</h2><div className="card-grid">{service.localizedChildren.map((child) => <Link className="service-card" key={child.id} href={`/${locale}/services/${child.slug}`}><h3>{child.translation?.name}</h3><p>{child.translation?.shortDescription}</p></Link>)}</div></div></section> : null}
      {service.media.length ? <section className="public-section"><div className="container-shell"><h2>{locale === 'ar' ? 'معرض الخدمة' : 'Service gallery'}</h2><div className="gallery-grid">{service.media.map((entry) => <PublicImage key={entry.id} asset={entry.media} locale={locale} />)}</div></div></section> : null}
      {service.localizedProjects.length ? <section className="public-section"><div className="container-shell"><h2>{locale === 'ar' ? 'مشاريع مرتبطة' : 'Related projects'}</h2><div className="project-grid">{service.localizedProjects.map((project) => <Link className="project-card" key={project.id} href={`/${locale}/projects/${project.slug}`}><div className="project-art" /><div><h3>{project.translation?.title}</h3><p>{project.translation?.summary}</p></div></Link>)}</div></div></section> : null}
      {service.localizedRelated.length ? <section className="public-section soft-section"><div className="container-shell"><h2>{locale === 'ar' ? 'خدمات ذات صلة' : 'Related services'}</h2><div className="card-grid">{service.localizedRelated.map((related) => <Link className="service-card" key={related.id} href={`/${locale}/services/${related.slug}`}><h3>{related.translation?.name}</h3><p>{related.translation?.shortDescription}</p></Link>)}</div></div></section> : null}
      <section className="public-section"><div className="container-shell"><div className="cta-panel"><h2>{locale === 'ar' ? 'هل أنت مستعد للبدء؟' : 'Ready to get started?'}</h2><p>{locale === 'ar' ? 'دعنا نصنع معاً تجربتك القادمة.' : 'Let us create your next exceptional experience together.'}</p><Link className="button" href={`/${locale}/contact`}>{locale === 'ar' ? 'تواصل معنا' : 'Contact us'}</Link></div></div></section>
    </main>
    <SiteFooter data={chrome} />
  </>;
}

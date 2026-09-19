import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import type { getPublicEntities, getPublicPage } from '@/lib/public-site';
import { localized } from '@/lib/public-site';
import { PublicImage } from '@/components/public/media';
import { ContactForm } from '@/components/public/contact-form';

type PublicPage = NonNullable<Awaited<ReturnType<typeof getPublicPage>>>;
type Section = PublicPage['sections'][number];
type Entities = Awaited<ReturnType<typeof getPublicEntities>>;

function copyFor(section: Section, locale: Locale) {
  return localized(section.translations, locale);
}

function ctaHref(section: Section, locale: Locale, primary = true) {
  const page = primary ? section.primaryCtaPage : section.secondaryCtaPage;
  const url = primary ? section.primaryCtaUrl : section.secondaryCtaUrl;
  if (page) return page.slug === 'home' ? `/${locale}` : `/${locale}/${page.slug}`;
  return url || null;
}

function Heading({ title, eyebrow, body }: { title?: string | null; eyebrow?: string | null; body?: string | null }) {
  return <div className="section-heading">
    {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
    {title ? <h2>{title}</h2> : null}
    {body ? <p>{body}</p> : null}
  </div>;
}

export function CapabilityMatrix({ locale, entities }: { locale: Locale; entities: Entities }) {
  if (!entities.capabilityPackages.length || !entities.capabilityFeatures.length) return null;
  const gridStyle = { gridTemplateColumns: 'minmax(220px,1.3fr) repeat(' + entities.capabilityPackages.length + ', minmax(160px,1fr))' };
  return <div className="capability-wrap">
    <div className="capability-table" role="table" aria-label={locale === 'ar' ? 'مقارنة باقات التنفيذ' : 'Execution package comparison'}>
      <div className="capability-row capability-head" role="row" style={gridStyle}>
        <div role="columnheader">{locale === 'ar' ? 'الخدمة والميزة' : 'Service & advantage'}</div>
        {entities.capabilityPackages.map((pkg) => <div role="columnheader" key={pkg.id}>{pkg.translation?.name}</div>)}
      </div>
      {entities.capabilityFeatures.map((feature) => <div className="capability-row" role="row" key={feature.id} style={gridStyle}>
        <div role="rowheader"><strong>{feature.translation?.name}</strong>{feature.translation?.description ? <small>{feature.translation.description}</small> : null}</div>
        {entities.capabilityPackages.map((pkg) => {
          const value = feature.values.find((item) => item.capabilityPackageId === pkg.id);
          return <div role="cell" key={pkg.id}>
            {!value || value.valueKind === 'NONE' ? <span aria-label={locale === 'ar' ? 'غير متوفر' : 'Not included'}>—</span>
              : value.valueKind === 'BOOLEAN' ? <span className="capability-check">{value.booleanValue ? '✓' : '—'}</span>
              : <span>{value.translation?.content || '—'}</span>}
          </div>;
        })}
      </div>)}
    </div>
    <div className="capability-mobile">
      {entities.capabilityPackages.map((pkg) => <article className="premium-card" key={pkg.id}><h3>{pkg.translation?.name}</h3>{pkg.translation?.description ? <p>{pkg.translation.description}</p> : null}
        <dl>{entities.capabilityFeatures.map((feature) => {
          const value=feature.values.find((item)=>item.capabilityPackageId===pkg.id);
          if (!value || value.valueKind === 'NONE') return null;
          return <div key={feature.id}><dt>{feature.translation?.name}</dt><dd>{value.valueKind === 'BOOLEAN' ? (value.booleanValue ? '✓' : '—') : value.translation?.content}</dd></div>;
        })}</dl>
      </article>)}
    </div>
  </div>;
}

export function SectionRenderer({ section, locale, entities, contactFormEnabled = true }: { section: Section; locale: Locale; entities: Entities; contactFormEnabled?: boolean }) {
  const copy = copyFor(section, locale);
  const primaryHref = ctaHref(section, locale, true);
  const secondaryHref = ctaHref(section, locale, false);
  const primaryLabel = copy?.primaryCtaLabel;
  const secondaryLabel = copy?.secondaryCtaLabel;
  const settings = section.settingsJson as Record<string, unknown>;

  if (section.sectionType === 'hero') {
    return <section className="hero-section">
      <div className="hero-geometry" aria-hidden="true" />
      {section.primaryMedia ? <div className="hero-media"><PublicImage asset={section.primaryMedia} locale={locale} /></div> : null}
      <div className="container-shell hero-content">
        {copy?.subtitle ? <p className="eyebrow">{copy.subtitle}</p> : null}
        <h1>{copy?.title}</h1>
        {copy?.body ? <p className="hero-copy">{copy.body}</p> : null}
        <div className="cta-row">
          {primaryHref && primaryLabel ? <Link className="button" href={primaryHref}>{primaryLabel}</Link> : null}
          {secondaryHref && secondaryLabel ? <Link className="button secondary public-secondary" href={secondaryHref}>{secondaryLabel}</Link> : null}
        </div>
      </div>
    </section>;
  }

  if (section.sectionType === 'metrics') {
    const max = typeof settings.maxItems === 'number' ? settings.maxItems : 4;
    const metrics = entities.metrics.slice(0, max);
    if (!metrics.length) return null;
    return <section className="public-section metrics-band"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <div className="metrics-grid">{metrics.map((metric) => <article key={metric.id}><strong dir="ltr">{metric.displayValue}{metric.suffix}</strong><span>{metric.translation?.label}</span>{metric.translation?.description ? <small>{metric.translation.description}</small> : null}</article>)}</div>
    </div></section>;
  }

  if (section.sectionType === 'featuredServices') {
    const max = typeof settings.maxItems === 'number' ? settings.maxItems : 6;
    const services = entities.services.filter((item) => item.featured).slice(0, max);
    if (!services.length) return null;
    return <section className="public-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <div className="card-grid">{services.map((service) => <Link className="service-card" href={`/${locale}/services/${service.slug}`} key={service.id}>
        <span className="card-index">{String(service.sortOrder).padStart(2,'0')}</span>
        <h3>{service.translation?.name}</h3><p>{service.translation?.shortDescription}</p><span className="text-link">{locale === 'ar' ? 'استكشف الخدمة' : 'Explore service'} <b aria-hidden="true">↗</b></span>
      </Link>)}</div>
    </div></section>;
  }

  if (section.sectionType === 'serviceIndex') {
    if (!entities.services.length) return null;
    const groups = entities.services.reduce((map, service) => {
      const current = map.get(service.categoryId) || [];
      current.push(service);
      map.set(service.categoryId, current);
      return map;
    }, new Map<string, typeof entities.services>());
    return <section className="public-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <div className="service-groups">{[...groups.values()].map((services) => <section className="service-group" key={services[0].categoryId}>
        <div className="service-group__heading"><h3>{services[0].categoryTranslation?.name}</h3>{services[0].categoryTranslation?.shortDescription ? <p>{services[0].categoryTranslation.shortDescription}</p> : null}</div>
        <div className="card-grid">{services.map((service) => <Link className="service-card" href={`/${locale}/services/${service.slug}`} key={service.id}>
          <span className="card-index">{String(service.sortOrder).padStart(2,'0')}</span><h3>{service.translation?.name}</h3><p>{service.translation?.shortDescription}</p><span className="text-link">{locale === 'ar' ? 'استكشف الخدمة' : 'Explore service'} <b aria-hidden="true">↗</b></span>
        </Link>)}</div>
      </section>)}</div>
    </div></section>;
  }

  if (section.sectionType === 'workCycle') {
    if (!entities.processSteps.length) return null;
    return <section className="public-section process-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <ol className="process-grid">{entities.processSteps.map((step) => <li key={step.id}><span>{step.number}</span><h3>{step.translation?.title}</h3><p>{step.translation?.description}</p></li>)}</ol>
    </div></section>;
  }

  if (section.sectionType === 'featuredProjects') {
    const max = typeof settings.maxItems === 'number' ? settings.maxItems : 4;
    const projects = entities.projects.filter((item) => item.featured).slice(0, max);
    if (!projects.length) return null;
    return <section className="public-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <div className="project-grid">{projects.map((project) => <Link className="project-card" href={`/${locale}/projects/${project.slug}`} key={project.id}>
        {project.coverMedia ? <PublicImage asset={project.coverMedia} locale={locale} /> : <div className="project-art" aria-hidden="true" />}
        <div><h3>{project.translation?.title}</h3><p>{project.translation?.summary}</p></div>
      </Link>)}</div>
    </div></section>;
  }

  if (section.sectionType === 'projectIndex') {
    return <section className="public-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <nav className="project-filters" aria-label={locale === 'ar' ? 'تصفية المشاريع' : 'Project filters'}>
        <Link href={`/${locale}/projects`}>{locale === 'ar' ? 'الكل' : 'All'}</Link>
        {entities.projectCategories.map((category) => <Link key={category.id} href={`/${locale}/projects?category=${category.slug}`}>{category.translation?.name}</Link>)}
      </nav>
      {entities.projects.length ? <div className="project-grid">{entities.projects.map((project) => <Link className="project-card" href={`/${locale}/projects/${project.slug}`} key={project.id}>
        {project.coverMedia ? <PublicImage asset={project.coverMedia} locale={locale} /> : <div className="project-art" aria-hidden="true" />}
        <div><h3>{project.translation?.title}</h3><p>{project.translation?.summary}</p></div>
      </Link>)}</div> : <div className="premium-card"><p>{locale === 'ar' ? 'لا توجد مشاريع منشورة ضمن هذا التصنيف حالياً.' : 'No published projects are currently available in this filter.'}</p></div>}
    </div></section>;
  }

  if (section.sectionType === 'clients') {
    const max = typeof settings.maxItems === 'number' ? settings.maxItems : 12;
    const clients = entities.clients.slice(0, max);
    if (!clients.length) return null;
    return <section className="public-section clients-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <div className="client-grid">{clients.map((client) => <div className="client-card" key={client.id}>{client.logo ? <PublicImage asset={client.logo} locale={locale} /> : <strong>{client.translation?.name}</strong>}</div>)}</div>
    </div></section>;
  }

  if (section.sectionType === 'leadership') {
    if (!entities.leadership.length) return null;
    return <section className="public-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} />
      <div className="leadership-grid">{entities.leadership.map((leader) => <article className="leadership-card" key={leader.id}>
        {leader.image ? <PublicImage asset={leader.image} locale={locale} /> : <div className="portrait-placeholder" aria-hidden="true" />}
        <div><blockquote>{leader.translation?.biographyOrMessage}</blockquote><h3>{leader.translation?.name}</h3><p>{leader.translation?.title}</p></div>
      </article>)}</div>
    </div></section>;
  }

  if (section.sectionType === 'capabilityComparison') {
    return <section className="public-section capability-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} /><CapabilityMatrix locale={locale} entities={entities} /></div></section>;
  }

  if (section.sectionType === 'contactDetails') {
    if (!entities.contacts.length) return null;
    return <section className="public-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} /><div className="contact-cards">
      {entities.contacts.map((person) => <article className="premium-card" key={person.id}><h3>{person.translation?.name}</h3>{person.translation?.title ? <p>{person.translation.title}</p> : null}{person.organization ? <p>{person.organization}</p> : null}{person.phone ? <a dir="ltr" href={`tel:${person.phone}`}>{person.phone}</a> : null}{person.email ? <a href={`mailto:${person.email}`}>{person.email}</a> : null}</article>)}
    </div></div></section>;
  }

  if (section.sectionType === 'contactForm') {
    if (!contactFormEnabled) return null;
    return <section className="public-section contact-form-section"><div className="container-shell narrow"><Heading title={copy?.title} body={copy?.body} />
      <ContactForm locale={locale} services={entities.services.map((service) => ({ id: service.id, name: service.translation?.name || service.slug }))} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </div></section>;
  }

  if (section.sectionType === 'gallery') {
    if (!section.media.length) return null;
    return <section className="public-section"><div className="container-shell"><Heading title={copy?.title} body={copy?.body} /><div className="gallery-grid">
      {section.media.map((entry) => <PublicImage key={entry.mediaId + entry.role} asset={entry.media} locale={locale} />)}
    </div></div></section>;
  }

  if (section.sectionType === 'cta') {
    return <section className="public-section"><div className="container-shell"><div className="cta-panel"><Heading title={copy?.title} body={copy?.body} /><div className="cta-row">{primaryHref && primaryLabel ? <Link className="button" href={primaryHref}>{primaryLabel}</Link> : null}{secondaryHref && secondaryLabel ? <Link className="button secondary public-secondary" href={secondaryHref}>{secondaryLabel}</Link> : null}</div></div></div></section>;
  }

  return <section className={`public-section ${section.sectionType === 'technologyFeature' ? 'technology-section' : ''}`}><div className="container-shell split-section">
    <div><Heading title={copy?.title} eyebrow={copy?.subtitle} body={copy?.body} /><div className="cta-row">{primaryHref && primaryLabel ? <Link className="text-link" href={primaryHref}>{primaryLabel} ↗</Link> : null}</div></div>
    {section.primaryMedia ? <PublicImage asset={section.primaryMedia} locale={locale} className="section-media" /> : <div className="geometric-art" aria-hidden="true"><span/><span/><span/></div>}
  </div></section>;
}

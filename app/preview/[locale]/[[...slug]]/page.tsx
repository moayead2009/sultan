import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { isLocale } from '@/lib/i18n';
import { getProject, getService } from '@/lib/public-site';
import { PublicImage } from '@/components/public/media';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function PreviewPage({
  params
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  await requireAdmin();
  const resolved = await params;
  const locale = locale;
  if (!isLocale(locale)) notFound();
  const parts = resolved.slug ?? [];

  if (parts[0] === 'services' && parts[1]) {
    const service = await getService(parts[1], locale, true);
    if (!service) notFound();
    return <main className="container-shell" style={{ paddingBlock: '3rem' }}>
      <p className="badge">Authenticated draft preview · {service.status}</p>
      <p><Link href="/admin/services">← Services CMS</Link></p>
      <h1>{service.translation?.name}</h1>
      <p>{service.translation?.shortDescription}</p>
      {service.coverMedia ? <PublicImage asset={service.coverMedia} locale={locale} className="section-media" /> : null}
      <section className="admin-card" style={{ marginBlock: '1rem' }}>
        <h2>{locale === 'ar' ? 'المحتوى' : 'Detailed content'}</h2>
        <p style={{ whiteSpace: 'pre-line' }}>{service.translation?.detailedContent}</p>
      </section>
      {service.localizedFeatures.map((feature) => <section className="admin-card" key={feature.id} style={{ marginBlock: '1rem' }}><h3>{feature.translation?.title}</h3><p>{feature.translation?.description}</p></section>)}
    </main>;
  }

  if (parts[0] === 'projects' && parts[1]) {
    const project = await getProject(parts[1], locale, true);
    if (!project) notFound();
    return <main className="container-shell" style={{ paddingBlock: '3rem' }}>
      <p className="badge">Authenticated draft preview · {project.status}</p>
      <p><Link href="/admin/projects">← Projects CMS</Link></p>
      <h1>{project.translation?.title}</h1>
      <p>{project.translation?.summary}</p>
      {project.coverMedia ? <PublicImage asset={project.coverMedia} locale={locale} className="section-media" /> : null}
      {project.translation?.detailedDescription ? <section className="admin-card" style={{ marginBlock: '1rem' }}><p style={{ whiteSpace: 'pre-line' }}>{project.translation.detailedDescription}</p></section> : null}
      {project.media.length ? <div className="gallery-grid">{project.media.map((entry) => <PublicImage key={entry.id} asset={entry.media} locale={locale} />)}</div> : null}
    </main>;
  }

  const slug = parts.join('/') || 'home';
  const page = await db.page.findUnique({
    where: { slug },
    include: {
      translations: true,
      sections: {
        where: { enabled: true },
        include: { translations: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
  if (!page) notFound();
  const translation = page.translations.find((row) => row.locale === locale);
  if (!translation) notFound();

  return <main className="container-shell" style={{ paddingBlock: '3rem' }}>
    <p className="badge">Authenticated draft preview · {page.status}</p>
    <p><Link href="/admin/pages">← Pages CMS</Link></p>
    <h1>{translation.title}</h1>
    {translation.summary ? <p>{translation.summary}</p> : null}
    {page.sections.map((section) => {
      const sectionCopy = section.translations.find((row) => row.locale === locale);
      return <section key={section.id} className="admin-card" style={{ marginBlock: '1rem' }}>
        <small>{section.sectionType}</small>
        <h2>{sectionCopy?.title ?? section.key}</h2>
        {sectionCopy?.body ? <p>{sectionCopy.body}</p> : null}
      </section>;
    })}
  </main>;
}

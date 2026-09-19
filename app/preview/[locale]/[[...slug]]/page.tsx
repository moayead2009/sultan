import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function PreviewPage({
  params
}: {
  params: { locale: string; slug?: string[] };
}) {
  await requireAdmin();
  if (!isLocale(params.locale)) notFound();
  const slug = params.slug?.join('/') || 'home';
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
  const translation = page.translations.find((row) => row.locale === params.locale);
  if (!translation) notFound();

  return (
    <main className="container-shell" style={{ paddingBlock: '3rem' }}>
      <p className="badge">Authenticated draft preview · {page.status}</p>
      <h1>{translation.title}</h1>
      {translation.summary ? <p>{translation.summary}</p> : null}
      {page.sections.map((section) => {
        const copy = section.translations.find((row) => row.locale === params.locale);
        return <section key={section.id} className="admin-card" style={{ marginBlock: '1rem' }}><small>{section.sectionType}</small><h2>{copy?.title ?? section.key}</h2>{copy?.body ? <p>{copy.body}</p> : null}</section>;
      })}
    </main>
  );
}

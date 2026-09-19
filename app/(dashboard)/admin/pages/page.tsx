import { db } from '@/lib/db';
import { SubmitButton } from '@/components/submit-button';
import { createPage, publishPage, unpublishPage, updatePageTranslation } from '../actions/pages';

export const dynamic = 'force-dynamic';

export default async function PagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const pages = await db.page.findMany({
    where: q ? { OR: [{ slug: { contains: q } }, { translations: { some: { title: { contains: q, mode: 'insensitive' } } } }] } : {},
    include: { translations: true },
    orderBy: { slug: 'asc' },
    take: 100
  });
  const seo = await db.seoMetadata.findMany({ where: { ownerType: 'Page' } });

  return (
    <div className="stack">
      <div><h1>Pages</h1><p>Publishing requires bilingual page copy, all enabled section contracts, and localized SEO metadata.</p></div>
      <form method="get" className="admin-card"><label>Search<input name="q" defaultValue={q} /></label><button className="button secondary">Search</button></form>
      <form action={createPage} className="admin-card form-grid">
        <h2>Create page</h2>
        <div className="split"><label>Slug<input name="slug" required /></label><label>Template<select name="template">{['home','about','services','service','projects','project','capabilities','clients','contact','legal'].map((t) => <option key={t}>{t}</option>)}</select></label></div>
        <div className="split"><label>English title<input name="enTitle" required /></label><label>Arabic title<input name="arTitle" dir="rtl" required /></label></div>
        <SubmitButton>Create page</SubmitButton>
      </form>
      {pages.length === 0 ? <div className="admin-card">No pages match this filter.</div> : pages.map((page) => (
        <article className="admin-card stack" key={page.id}>
          <div><strong>/{page.slug}</strong> · <span className="badge">{page.template}</span> <span className="badge">{page.status}</span></div>
          <div className="split">
            {(['en','ar'] as const).map((locale) => {
              const copy = page.translations.find((row) => row.locale === locale);
              const meta = seo.find((row) => row.ownerId === page.id && row.locale === locale);
              return <form action={updatePageTranslation} className="form-grid" key={locale}>
                <input type="hidden" name="pageId" value={page.id} /><input type="hidden" name="locale" value={locale} />
                <h3>{locale.toUpperCase()}</h3>
                <label>Title<input name="title" dir={locale === 'ar' ? 'rtl' : 'ltr'} defaultValue={copy?.title ?? ''} required /></label>
                <label>Navigation label<input name="navigationLabel" dir={locale === 'ar' ? 'rtl' : 'ltr'} defaultValue={copy?.navigationLabel ?? ''} /></label>
                <label>Summary<textarea name="summary" dir={locale === 'ar' ? 'rtl' : 'ltr'} defaultValue={copy?.summary ?? ''} /></label>
                <label>SEO title<input name="seoTitle" dir={locale === 'ar' ? 'rtl' : 'ltr'} defaultValue={meta?.title ?? ''} /></label>
                <label>SEO description<textarea name="seoDescription" dir={locale === 'ar' ? 'rtl' : 'ltr'} defaultValue={meta?.description ?? ''} /></label>
                <SubmitButton className="button secondary">Save {locale.toUpperCase()}</SubmitButton>
              </form>;
            })}
          </div>
          <div>{page.status === 'PUBLISHED'
            ? <form action={unpublishPage}><input type="hidden" name="id" value={page.id} /><SubmitButton className="button secondary" confirmMessage="Unpublish this page?">Unpublish</SubmitButton></form>
            : <form action={publishPage}><input type="hidden" name="id" value={page.id} /><SubmitButton confirmMessage="Publish this page after validating all bilingual requirements?">Publish</SubmitButton></form>}
          </div>
        </article>
      ))}
    </div>
  );
}

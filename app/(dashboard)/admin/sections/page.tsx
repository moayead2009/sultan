import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { SubmitButton } from '@/components/submit-button';
import { createSection, deleteSection, toggleSection, updateSection } from '../actions/sections';

export const dynamic = 'force-dynamic';

const sectionTypes = ['hero','intro','metrics','featuredServices','workCycle','featuredProjects','technologyFeature','clients','cta','richText','gallery','leadership','capabilityComparison','serviceIndex','projectIndex','contactDetails','contactForm'];

export default async function SectionsPage({ searchParams }: { searchParams: Promise<{ q?: string; pageId?: string }> }) {
  const session = await requireAdmin();
  const query = await searchParams;
  const [pages, media] = await Promise.all([
    db.page.findMany({ orderBy: { slug: 'asc' } }),
    db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  ]);
  const where = {
    ...(query.pageId ? { pageId: query.pageId } : {}),
    ...(query.q ? { OR: [{ key: { contains: query.q } }, { sectionType: { contains: query.q } }] } : {})
  };
  const sections = await db.pageSection.findMany({
    where,
    include: { page: true, translations: true, media: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ pageId: 'asc' }, { sortOrder: 'asc' }]
  });

  return (
    <div className="stack">
      <div><h1>Page sections</h1><p>Section types remain constrained to the approved contracts; settings reject unknown keys.</p></div>
      <form method="get" className="admin-card split">
        <label>Filter page<select name="pageId" defaultValue={query.pageId ?? ''}><option value="">All pages</option>{pages.map((p) => <option value={p.id} key={p.id}>/{p.slug}</option>)}</select></label>
        <label>Search<input name="q" defaultValue={query.q ?? ''} placeholder="Key or type" /></label>
        <button className="button secondary">Filter</button>
      </form>
      <form action={createSection} className="admin-card form-grid">
        <h2>Create section</h2>
        <div className="split"><label>Page<select name="pageId">{pages.map((p) => <option value={p.id} key={p.id}>/{p.slug}</option>)}</select></label><label>Type<select name="sectionType">{sectionTypes.map((t) => <option key={t}>{t}</option>)}</select></label></div>
        <div className="split"><label>Key<input name="key" required /></label><label>Order<input type="number" name="sortOrder" defaultValue="0" /></label></div>
        <div className="split"><label>EN title<input name="enTitle" /></label><label>AR title<input name="arTitle" dir="rtl" /></label></div>
        <label>Strict settings JSON<textarea name="settingsJson" defaultValue="{}" /></label>
        <SubmitButton>Create section</SubmitButton>
      </form>
      {sections.length === 0 ? <div className="admin-card">No sections match this filter.</div> : sections.map((section) => {
        const en = section.translations.find((r) => r.locale === 'en');
        const ar = section.translations.find((r) => r.locale === 'ar');
        const gallery = section.media.map((m) => m.mediaId).join(',');
        return <article className="admin-card stack" key={section.id}>
          <div><strong>/{section.page.slug} · {section.key}</strong> <span className="badge">{section.sectionType}</span> <span className="badge">{section.enabled ? 'Enabled' : 'Disabled'}</span></div>
          <form action={updateSection} className="form-grid">
            <input type="hidden" name="id" value={section.id} />
            <div className="split"><label>Order<input name="sortOrder" type="number" defaultValue={section.sortOrder} /></label><label><input name="enabled" type="checkbox" defaultChecked={section.enabled} /> Enabled</label></div>
            <label>Settings JSON<textarea name="settingsJson" defaultValue={JSON.stringify(section.settingsJson, null, 2)} /></label>
            <div className="split">
              <fieldset className="form-grid"><legend>English</legend><label>Title<input name="enTitle" defaultValue={en?.title ?? ''} /></label><label>Subtitle<input name="enSubtitle" defaultValue={en?.subtitle ?? ''} /></label><label>Body<textarea name="enBody" defaultValue={en?.body ?? ''} /></label><label>Primary CTA label<input name="enPrimaryCtaLabel" defaultValue={en?.primaryCtaLabel ?? ''} /></label><label>Secondary CTA label<input name="enSecondaryCtaLabel" defaultValue={en?.secondaryCtaLabel ?? ''} /></label><label>Accessible label<input name="enAccessibleLabel" defaultValue={en?.accessibleLabel ?? ''} /></label></fieldset>
              <fieldset className="form-grid" dir="rtl"><legend>العربية</legend><label>العنوان<input name="arTitle" defaultValue={ar?.title ?? ''} /></label><label>العنوان الفرعي<input name="arSubtitle" defaultValue={ar?.subtitle ?? ''} /></label><label>المحتوى<textarea name="arBody" defaultValue={ar?.body ?? ''} /></label><label>زر الإجراء الرئيسي<input name="arPrimaryCtaLabel" defaultValue={ar?.primaryCtaLabel ?? ''} /></label><label>زر الإجراء الثانوي<input name="arSecondaryCtaLabel" defaultValue={ar?.secondaryCtaLabel ?? ''} /></label><label>التسمية المساعدة<input name="arAccessibleLabel" defaultValue={ar?.accessibleLabel ?? ''} /></label></fieldset>
            </div>
            <div className="split">
              <label>Primary media<select name="primaryMediaId" defaultValue={section.primaryMediaId ?? ''}><option value="">—</option>{media.map((m) => <option value={m.id} key={m.id}>{m.originalFilename}</option>)}</select></label>
              <label>Secondary media<select name="secondaryMediaId" defaultValue={section.secondaryMediaId ?? ''}><option value="">—</option>{media.map((m) => <option value={m.id} key={m.id}>{m.originalFilename}</option>)}</select></label>
            </div>
            <label>Gallery media IDs (comma-separated, ordered)<input name="galleryMediaIds" defaultValue={gallery} /></label>
            <div className="split">
              <label>Primary CTA page<select name="primaryCtaPageId" defaultValue={section.primaryCtaPageId ?? ''}><option value="">—</option>{pages.map((p) => <option value={p.id} key={p.id}>/{p.slug}</option>)}</select></label>
              <label>Primary CTA URL<input name="primaryCtaUrl" defaultValue={section.primaryCtaUrl ?? ''} /></label>
            </div>
            <div className="split">
              <label>Secondary CTA page<select name="secondaryCtaPageId" defaultValue={section.secondaryCtaPageId ?? ''}><option value="">—</option>{pages.map((p) => <option value={p.id} key={p.id}>/{p.slug}</option>)}</select></label>
              <label>Secondary CTA URL<input name="secondaryCtaUrl" defaultValue={section.secondaryCtaUrl ?? ''} /></label>
            </div>
            <SubmitButton>Save section</SubmitButton>
          </form>
          <div className="split">
            <form action={toggleSection}><input type="hidden" name="id" value={section.id} /><SubmitButton className="button secondary">{section.enabled ? 'Disable' : 'Enable'}</SubmitButton></form>
            {session.user.role === 'OWNER' ? <form action={deleteSection}><input type="hidden" name="id" value={section.id} /><SubmitButton className="button danger" confirmMessage="Permanently delete this section?">Hard delete</SubmitButton></form> : null}
          </div>
        </article>;
      })}
    </div>
  );
}

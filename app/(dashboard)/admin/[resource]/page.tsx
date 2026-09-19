import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { MediaUploader } from '@/components/media-uploader';
import {
  createContactPerson,
  createPage,
  createRedirect,
  createSection,
  createUser,
  publishPage,
  toggleSection,
  unpublishPage,
  updatePageTranslation,
  updateSiteSettings
} from '../actions';

export const dynamic = 'force-dynamic';

const resources = [
  'site-settings',
  'pages',
  'sections',
  'navigation',
  'media',
  'contact-people',
  'redirects',
  'users'
];

export default async function AdminResourcePage({ params }: { params: { resource: string } }) {
  if (!resources.includes(params.resource)) notFound();
  const session = await requireAdmin();

  if (params.resource === 'site-settings') {
    const settings = await db.siteSettings.findUnique({ where: { id: 'site' } });
    return (
      <div className="stack">
        <h1>Site settings</h1>
        <form action={updateSiteSettings} className="admin-card form-grid">
          <label>Default locale
            <select name="defaultLocale" defaultValue={settings?.defaultLocale ?? 'ar'}>
              <option value="ar">Arabic</option><option value="en">English</option>
            </select>
          </label>
          <div className="split">
            <label>English brand name<input name="brandNameEnglish" defaultValue={settings?.brandNameEnglish ?? ''} /></label>
            <label>Arabic brand name<input name="brandNameArabic" defaultValue={settings?.brandNameArabic ?? ''} /></label>
          </div>
          <label>Website URL<input name="websiteUrl" defaultValue={settings?.websiteUrl ?? ''} /></label>
          <div className="split">
            <label>Primary phone<input name="contactPhonePrimary" defaultValue={settings?.contactPhonePrimary ?? ''} /></label>
            <label>Secondary phone<input name="contactPhoneSecondary" defaultValue={settings?.contactPhoneSecondary ?? ''} /></label>
          </div>
          <label>Contact email<input type="email" name="contactEmail" defaultValue={settings?.contactEmail ?? ''} /></label>
          <label>Address<input name="addressLine1" defaultValue={settings?.addressLine1 ?? ''} /></label>
          <label><input type="checkbox" name="contactFormEnabled" defaultChecked={settings?.contactFormEnabled ?? false} /> Contact form enabled</label>
          <button className="button" type="submit">Save settings</button>
        </form>
      </div>
    );
  }

  if (params.resource === 'pages') {
    const pages = await db.page.findMany({ include: { translations: true }, orderBy: { slug: 'asc' } });
    return (
      <div className="stack">
        <h1>Pages</h1>
        <form action={createPage} className="admin-card form-grid">
          <div className="split">
            <label>Slug<input name="slug" required /></label>
            <label>Template
              <select name="template" defaultValue="legal">
                {['home','about','services','service','projects','project','capabilities','clients','contact','legal'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className="split">
            <label>English title<input name="enTitle" required /></label>
            <label>Arabic title<input name="arTitle" dir="rtl" required /></label>
          </div>
          <button className="button" type="submit">Create page</button>
        </form>
        {pages.map((page) => (
          <article className="admin-card stack" key={page.id}>
            <div><strong>/{page.slug}</strong> <span className="badge">{page.status}</span></div>
            <div className="split">
              {(['en','ar'] as const).map((locale) => {
                const value = page.translations.find((row) => row.locale === locale);
                return (
                  <form action={updatePageTranslation} className="form-grid" key={locale}>
                    <input type="hidden" name="pageId" value={page.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <label>{locale.toUpperCase()} title<input name="title" defaultValue={value?.title ?? ''} required /></label>
                    <label>Summary<textarea name="summary" defaultValue={value?.summary ?? ''} /></label>
                    <button className="button secondary" type="submit">Save {locale.toUpperCase()}</button>
                  </form>
                );
              })}
            </div>
            <div>
              {page.status === 'PUBLISHED' ? (
                <form action={unpublishPage}><input type="hidden" name="id" value={page.id} /><button className="button secondary">Unpublish</button></form>
              ) : (
                <form action={publishPage}><input type="hidden" name="id" value={page.id} /><button className="button">Publish</button></form>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (params.resource === 'sections') {
    const [pages, sections] = await Promise.all([
      db.page.findMany({ orderBy: { slug: 'asc' } }),
      db.pageSection.findMany({ include: { page: true, translations: true }, orderBy: [{ pageId: 'asc' }, { sortOrder: 'asc' }] })
    ]);
    return (
      <div className="stack">
        <h1>Page sections</h1>
        <form action={createSection} className="admin-card form-grid">
          <div className="split">
            <label>Page<select name="pageId">{pages.map((page) => <option value={page.id} key={page.id}>{page.slug}</option>)}</select></label>
            <label>Type<select name="sectionType">{['hero','intro','metrics','featuredServices','workCycle','featuredProjects','technologyFeature','clients','cta','richText','gallery','leadership','capabilityComparison','serviceIndex','projectIndex','contactDetails','contactForm'].map((type) => <option key={type}>{type}</option>)}</select></label>
          </div>
          <div className="split"><label>Key<input name="key" required /></label><label>Order<input type="number" name="sortOrder" defaultValue="0" /></label></div>
          <div className="split"><label>EN title<input name="enTitle" /></label><label>AR title<input name="arTitle" dir="rtl" /></label></div>
          <label>Strict settings JSON<textarea name="settingsJson" defaultValue="{}" /></label>
          <button className="button">Create section</button>
        </form>
        <div className="admin-card table-wrap">
          <table><thead><tr><th>Page</th><th>Key</th><th>Type</th><th>State</th><th /></tr></thead>
          <tbody>{sections.map((section) => <tr key={section.id}><td>{section.page.slug}</td><td>{section.key}</td><td>{section.sectionType}</td><td>{section.enabled ? 'Enabled' : 'Disabled'}</td><td><form action={toggleSection}><input type="hidden" name="id" value={section.id} /><button className="button secondary">{section.enabled ? 'Disable' : 'Enable'}</button></form></td></tr>)}</tbody></table>
        </div>
      </div>
    );
  }

  if (params.resource === 'navigation') {
    const menus = await db.navigationMenu.findMany({ include: { items: { include: { translations: true } } } });
    return <div className="stack"><h1>Navigation</h1><div className="admin-card"><p>Navigation is relational and localized. Phase 2 completes full ordering/link editing.</p>{menus.map((menu) => <p key={menu.id}><strong>{menu.key}</strong> — {menu.items.length} items</p>)}</div></div>;
  }

  if (params.resource === 'media') {
    const media = await db.mediaAsset.findMany({ include: { translations: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return <div className="stack"><h1>Media</h1><MediaUploader /><div className="admin-card table-wrap"><table><thead><tr><th>File</th><th>Dimensions</th><th>Alt text</th></tr></thead><tbody>{media.map((item) => <tr key={item.id}><td>{item.originalFilename}</td><td>{item.width}×{item.height}</td><td>{item.translations.map((row) => row.locale + ': ' + (row.altText ?? '')).join(' | ')}</td></tr>)}</tbody></table></div></div>;
  }

  if (params.resource === 'contact-people') {
    const people = await db.contactPerson.findMany({ include: { translations: true }, orderBy: { sortOrder: 'asc' } });
    return <div className="stack"><h1>Contact people</h1><form action={createContactPerson} className="admin-card form-grid"><div className="split"><label>English name<input name="enName" required /></label><label>Arabic name<input name="arName" dir="rtl" required /></label></div><div className="split"><label>English title<input name="enTitle" /></label><label>Arabic title<input name="arTitle" dir="rtl" /></label></div><div className="split"><label>Phone<input name="phone" /></label><label>Email<input name="email" type="email" /></label></div><label>Organization<input name="organization" /></label><label><input type="checkbox" name="enabled" defaultChecked /> Enabled</label><button className="button">Create person</button></form><div className="admin-card">{people.map((person) => <p key={person.id}>{person.translations.find((row) => row.locale === 'en')?.name} — {person.phone ?? 'No phone'}</p>)}</div></div>;
  }

  if (params.resource === 'redirects') {
    const redirects = await db.redirect.findMany({ orderBy: { createdAt: 'desc' } });
    return <div className="stack"><h1>Redirects</h1><form action={createRedirect} className="admin-card form-grid"><div className="split"><label>From<input name="fromPath" placeholder="/old-path" required /></label><label>To<input name="toPath" placeholder="/en/new-path" required /></label></div><button className="button">Add redirect</button></form><div className="admin-card">{redirects.map((item) => <p key={item.id}><code>{item.fromPath}</code> → <code>{item.toPath}</code></p>)}</div></div>;
  }

  if (params.resource === 'users') {
    if (session.user.role !== 'OWNER') return <div className="admin-card"><h1>Unauthorized</h1><p>Only OWNER may manage administrator accounts.</p></div>;
    const users = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
    return <div className="stack"><h1>Users</h1><form action={createUser} className="admin-card form-grid"><div className="split"><label>Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label></div><div className="split"><label>Role<select name="role"><option>ADMIN</option><option>OWNER</option></select></label><label>Initial password<input name="password" type="password" minLength={12} required /></label></div><button className="button">Create user</button></form><div className="admin-card table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.status}</td></tr>)}</tbody></table></div></div>;
  }

  notFound();
}

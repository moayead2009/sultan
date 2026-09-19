import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { SubmitButton } from '@/components/submit-button';
import { createNavigationItem, deleteNavigationItem, updateNavigationItem } from '../actions/navigation';

export const dynamic = 'force-dynamic';

export default async function NavigationPage() {
  const session = await requireAdmin();
  const [menus, pages] = await Promise.all([
    db.navigationMenu.findMany({ include: { items: { include: { translations: true }, orderBy: { sortOrder: 'asc' } } }, orderBy: { key: 'asc' } }),
    db.page.findMany({ orderBy: { slug: 'asc' } })
  ]);
  return (
    <div className="stack">
      <div><h1>Navigation</h1><p>Localized labels, hierarchy, ordering, internal-page destinations and safe custom URLs are managed here.</p></div>
      {menus.map((menu) => (
        <section className="stack" key={menu.id}>
          <h2>{menu.key}</h2>
          <form action={createNavigationItem} className="admin-card form-grid">
            <input type="hidden" name="menuId" value={menu.id} />
            <div className="split"><label>English label<input name="enLabel" required /></label><label>Arabic label<input name="arLabel" dir="rtl" required /></label></div>
            <div className="split">
              <label>Internal page<select name="internalPageId" defaultValue=""><option value="">—</option>{pages.map((p) => <option value={p.id} key={p.id}>/{p.slug}</option>)}</select></label>
              <label>Or custom URL<input name="customUrl" placeholder="/en/path or https://…" /></label>
            </div>
            <div className="split">
              <label>Parent<select name="parentId" defaultValue=""><option value="">Top level</option>{menu.items.map((i) => <option value={i.id} key={i.id}>{i.translations.find((t) => t.locale === 'en')?.label ?? i.id}</option>)}</select></label>
              <label>Order<input type="number" name="sortOrder" defaultValue="0" /></label>
            </div>
            <div className="split"><label><input type="checkbox" name="enabled" defaultChecked /> Enabled</label><label><input type="checkbox" name="targetBlank" /> Open in new tab</label></div>
            <SubmitButton>Create navigation item</SubmitButton>
          </form>
          {menu.items.length === 0 ? <div className="admin-card">No navigation items in this menu.</div> : menu.items.map((item) => {
            const en = item.translations.find((t) => t.locale === 'en');
            const ar = item.translations.find((t) => t.locale === 'ar');
            return <form action={updateNavigationItem} className="admin-card form-grid" key={item.id}>
              <input type="hidden" name="id" value={item.id} />
              <div className="split"><label>English label<input name="enLabel" defaultValue={en?.label ?? ''} required /></label><label>Arabic label<input name="arLabel" dir="rtl" defaultValue={ar?.label ?? ''} required /></label></div>
              <div className="split">
                <label>Internal page<select name="internalPageId" defaultValue={item.internalPageId ?? ''}><option value="">—</option>{pages.map((p) => <option value={p.id} key={p.id}>/{p.slug}</option>)}</select></label>
                <label>Custom URL<input name="customUrl" defaultValue={item.customUrl ?? ''} /></label>
              </div>
              <div className="split">
                <label>Parent<select name="parentId" defaultValue={item.parentId ?? ''}><option value="">Top level</option>{menu.items.filter((i) => i.id !== item.id).map((i) => <option value={i.id} key={i.id}>{i.translations.find((t) => t.locale === 'en')?.label ?? i.id}</option>)}</select></label>
                <label>Order<input type="number" name="sortOrder" defaultValue={item.sortOrder} /></label>
              </div>
              <div className="split"><label><input type="checkbox" name="enabled" defaultChecked={item.enabled} /> Enabled</label><label><input type="checkbox" name="targetBlank" defaultChecked={item.targetBlank} /> Open in new tab</label></div>
              <div><SubmitButton>Save</SubmitButton>{session.user.role === 'OWNER' ? <SubmitButton formAction={deleteNavigationItem} className="button danger" confirmMessage="Permanently delete this navigation item?">Hard delete</SubmitButton> : null}</div>
            </form>;
          })}
        </section>
      ))}
    </div>
  );
}

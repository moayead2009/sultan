import { db } from '@/lib/db';
import { SubmitButton } from '@/components/submit-button';
import { requireAdmin } from '@/lib/authorization';
import { saveContactPerson, deleteContactPerson } from '../actions/content';

export const dynamic = 'force-dynamic';

export default async function ContactPeoplePage() {
  const session = await requireAdmin();
  const [people, media] = await Promise.all([
    db.contactPerson.findMany({ include: { translations: true }, orderBy: { sortOrder: 'asc' } }),
    db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 250 })
  ]);
  return (
    <div className="stack">
      <div><h1>Contact people</h1><p>Only populated fields render publicly. Email, organization and image remain optional.</p></div>
      <form action={saveContactPerson} className="admin-card form-grid">
        <h2>Create contact person</h2>
        <div className="split"><label>English name<input name="enName" required /></label><label>Arabic name<input name="arName" dir="rtl" required /></label></div>
        <div className="split"><label>English title<input name="enTitle" /></label><label>Arabic title<input name="arTitle" dir="rtl" /></label></div>
        <div className="split"><label>Phone<input name="phone" /></label><label>Email<input name="email" type="email" /></label></div>
        <label>Organization<input name="organization" /></label>
        <label>Image<select name="imageId"><option value="">None</option>{media.map((item)=><option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
        <label>Order<input name="sortOrder" type="number" defaultValue="0"/></label>
        <label><input type="checkbox" name="enabled" defaultChecked /> Enabled</label>
        <SubmitButton>Create contact person</SubmitButton>
      </form>
      {people.length === 0 ? <div className="admin-card">No contact people configured.</div> : people.map((person) => {
        const en=person.translations.find((r)=>r.locale==='en');
        const ar=person.translations.find((r)=>r.locale==='ar');
        return <form action={saveContactPerson} className="admin-card form-grid" key={person.id}>
          <input type="hidden" name="id" value={person.id}/>
          <div><strong>{en?.name}</strong> · {person.phone ?? 'No phone'} · <span className="badge">{person.enabled?'Enabled':'Hidden'}</span></div>
          <div className="split"><label>English name<input name="enName" defaultValue={en?.name ?? ''} required /></label><label>Arabic name<input name="arName" dir="rtl" defaultValue={ar?.name ?? ''} required /></label></div>
          <div className="split"><label>English title<input name="enTitle" defaultValue={en?.title ?? ''} /></label><label>Arabic title<input name="arTitle" dir="rtl" defaultValue={ar?.title ?? ''} /></label></div>
          <div className="split"><label>Phone<input name="phone" defaultValue={person.phone ?? ''}/></label><label>Email<input name="email" type="email" defaultValue={person.email ?? ''}/></label></div>
          <label>Organization<input name="organization" defaultValue={person.organization ?? ''}/></label>
          <label>Image<select name="imageId" defaultValue={person.imageId ?? ''}><option value="">None</option>{media.map((item)=><option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
          <label>Order<input name="sortOrder" type="number" defaultValue={person.sortOrder}/></label>
          <label><input name="enabled" type="checkbox" defaultChecked={person.enabled}/> Enabled</label>
          <div><SubmitButton>Save contact</SubmitButton>{session.user.role==='OWNER'?<SubmitButton formAction={deleteContactPerson} className="button danger" confirmMessage="Permanently delete this contact person?">Delete</SubmitButton>:null}</div>
        </form>;
      })}
    </div>
  );
}

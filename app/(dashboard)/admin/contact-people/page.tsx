import { db } from '@/lib/db';
import { SubmitButton } from '@/components/submit-button';
import { createContactPerson } from '../actions/contacts';

export const dynamic = 'force-dynamic';

export default async function ContactPeoplePage() {
  const people = await db.contactPerson.findMany({ include: { translations: true }, orderBy: { sortOrder: 'asc' } });
  return (
    <div className="stack">
      <h1>Contact people</h1>
      <form action={createContactPerson} className="admin-card form-grid">
        <div className="split"><label>English name<input name="enName" required /></label><label>Arabic name<input name="arName" dir="rtl" required /></label></div>
        <div className="split"><label>English title<input name="enTitle" /></label><label>Arabic title<input name="arTitle" dir="rtl" /></label></div>
        <div className="split"><label>Phone<input name="phone" /></label><label>Email<input name="email" type="email" /></label></div>
        <label>Organization<input name="organization" /></label><label><input type="checkbox" name="enabled" defaultChecked /> Enabled</label>
        <SubmitButton>Create contact person</SubmitButton>
      </form>
      {people.length === 0 ? <div className="admin-card">No contact people configured.</div> : <div className="admin-card">{people.map((person) => <p key={person.id}>{person.translations.find((r) => r.locale === 'en')?.name} · {person.phone ?? 'No phone'}</p>)}</div>}
    </div>
  );
}

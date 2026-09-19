import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { SubmitButton } from '@/components/submit-button';
import { createRedirect, deleteRedirect, updateRedirect } from '../actions/redirects';

export const dynamic = 'force-dynamic';

export default async function RedirectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireAdmin();
  const { q = '' } = await searchParams;
  const redirects = await db.redirect.findMany({
    where: q ? { OR: [{ fromPath: { contains: q } }, { toPath: { contains: q } }] } : {},
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return (
    <div className="stack">
      <div><h1>Redirects</h1><p>Enabled records are applied by the application proxy before public route handling.</p></div>
      <form method="get" className="admin-card"><label>Filter<input name="q" defaultValue={q} /></label><button className="button secondary">Filter</button></form>
      <form action={createRedirect} className="admin-card form-grid">
        <div className="split"><label>From<input name="fromPath" placeholder="/old-path" required /></label><label>To<input name="toPath" placeholder="/en/new-path" required /></label></div>
        <label><input name="permanent" type="checkbox" defaultChecked /> Permanent (308)</label>
        <SubmitButton>Create redirect</SubmitButton>
      </form>
      {redirects.length === 0 ? <div className="admin-card">No redirects configured.</div> : redirects.map((item) => (
        <form action={updateRedirect} className="admin-card form-grid" key={item.id}>
          <input type="hidden" name="id" value={item.id} />
          <div className="split"><label>From<input name="fromPath" defaultValue={item.fromPath} required /></label><label>To<input name="toPath" defaultValue={item.toPath} required /></label></div>
          <div className="split"><label><input name="enabled" type="checkbox" defaultChecked={item.enabled} /> Enabled</label><label><input name="permanent" type="checkbox" defaultChecked={item.permanent} /> Permanent</label></div>
          <div><SubmitButton>Save</SubmitButton>{session.user.role === 'OWNER' ? <SubmitButton formAction={deleteRedirect} className="button danger" confirmMessage="Permanently delete this redirect?">Delete</SubmitButton> : null}</div>
        </form>
      ))}
    </div>
  );
}

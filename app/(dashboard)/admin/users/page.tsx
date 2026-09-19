import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { SubmitButton } from '@/components/submit-button';
import { createUser, deleteUser, resetUserPassword, setUserStatus } from '../actions/users';

export const dynamic = 'force-dynamic';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await requireAdmin(['OWNER']);
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const q = (query.q ?? '').trim();
  const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] } : {};
  const [users, count] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: 'asc' }, skip: (page - 1) * 25, take: 25 }),
    db.user.count({ where })
  ]);

  return (
    <div className="stack">
      <div><h1>Users</h1><p>OWNER-only account management. Disabling or resetting a password revokes active sessions.</p></div>
      <form method="get" className="admin-card"><label>Search<input name="q" defaultValue={q} placeholder="Name or email" /></label><button className="button secondary">Search</button></form>
      <form action={createUser} className="admin-card form-grid">
        <h2>Create administrator</h2>
        <div className="split"><label>Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label></div>
        <div className="split"><label>Role<select name="role"><option>ADMIN</option><option>OWNER</option></select></label><label>Initial password<input name="password" type="password" minLength={12} required /></label></div>
        <SubmitButton>Create user</SubmitButton>
      </form>
      {users.length === 0 ? <div className="admin-card">No users match this search.</div> : users.map((user) => (
        <article className="admin-card stack" key={user.id}>
          <div><strong>{user.name}</strong> · {user.email} · <span className="badge">{user.role}</span> <span className="badge">{user.status}</span></div>
          <div className="split">
            <form action={setUserStatus}>
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="status" value={user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'} />
              <SubmitButton className="button secondary" confirmMessage={user.status === 'ACTIVE' ? 'Disable this account and revoke its sessions?' : undefined}>{user.status === 'ACTIVE' ? 'Disable' : 'Re-enable'}</SubmitButton>
            </form>
            <form action={resetUserPassword} className="form-grid">
              <input type="hidden" name="id" value={user.id} />
              <label>New password<input name="password" type="password" minLength={12} required /></label>
              <SubmitButton className="button secondary" confirmMessage="Reset password and revoke all existing sessions?">Reset password</SubmitButton>
            </form>
          </div>
          {user.id !== session.user.id ? <form action={deleteUser}><input type="hidden" name="id" value={user.id} /><SubmitButton className="button danger" confirmMessage="Permanently delete this account?">Hard delete</SubmitButton></form> : null}
        </article>
      ))}
      <p>Page {page} · {count} total</p>
    </div>
  );
}

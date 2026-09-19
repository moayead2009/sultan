import { requireAdmin } from '@/lib/authorization';
import { SubmitButton } from '@/components/submit-button';
import { changeOwnPassword } from '../actions/users';

export default async function AccountPage() {
  const session = await requireAdmin();
  return (
    <div className="stack">
      <div><h1>My account</h1><p>{session.user.email} · {session.user.role}</p></div>
      <form action={changeOwnPassword} className="admin-card form-grid">
        <h2>Change password</h2>
        <p>Changing your password revokes all existing sessions, including this one.</p>
        <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
        <SubmitButton confirmMessage="Change password and revoke all active sessions?">Change password</SubmitButton>
      </form>
    </div>
  );
}

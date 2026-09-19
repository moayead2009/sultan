import { AdminShell } from '@/components/admin-shell';
import { requireAdmin } from '@/lib/authorization';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <AdminShell
      userName={session.user.name ?? session.user.email ?? 'Administrator'}
      isOwner={session.user.role === 'OWNER'}
    >
      {children}
    </AdminShell>
  );
}

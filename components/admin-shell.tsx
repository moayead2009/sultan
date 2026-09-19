import Link from 'next/link';

const items = [
  ['Overview', '/admin'],
  ['Site settings', '/admin/site-settings'],
  ['Pages', '/admin/pages'],
  ['Sections', '/admin/sections'],
  ['Navigation', '/admin/navigation'],
  ['Media', '/admin/media'],
  ['Contact people', '/admin/contact-people'],
  ['Redirects', '/admin/redirects'],
  ['Users', '/admin/users']
] as const;

export function AdminShell({
  children,
  userName,
  isOwner
}: {
  children: React.ReactNode;
  userName: string;
  isOwner: boolean;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <strong>Solutions Gate CMS</strong>
        <p style={{ opacity: 0.75 }}>{userName}</p>
        <nav aria-label="CMS">
          {items
            .filter(([label]) => label !== 'Users' || isOwner)
            .map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          <Link href="/api/auth/signout">Sign out</Link>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

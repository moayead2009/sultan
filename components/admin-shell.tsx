import Link from 'next/link';

const items = [
  ['Overview', '/admin'],
  ['My account', '/admin/account'],
  ['Homepage', '/admin/homepage'],
  ['About', '/admin/about'],
  ['Pages', '/admin/pages'],
  ['Sections', '/admin/sections'],
  ['Services', '/admin/services'],
  ['Service categories', '/admin/service-categories'],
  ['Projects', '/admin/projects'],
  ['Galleries', '/admin/galleries'],
  ['Clients', '/admin/clients'],
  ['Capabilities', '/admin/capabilities'],
  ['Metrics', '/admin/metrics'],
  ['Work cycle', '/admin/work-cycle'],
  ['Leadership', '/admin/leadership'],
  ['Contact people', '/admin/contact-people'],
  ['Contact settings', '/admin/contact-settings'],
  ['Inquiries', '/admin/inquiries'],
  ['Navigation', '/admin/navigation'],
  ['Footer', '/admin/footer'],
  ['Branding', '/admin/branding'],
  ['Media', '/admin/media'],
  ['Buttons & CTAs', '/admin/buttons'],
  ['SEO', '/admin/seo'],
  ['Redirects', '/admin/redirects'],
  ['Global settings', '/admin/global-settings'],
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
      <a className="skip-link" href="#admin-main">Skip to administration content</a>
      <aside className="admin-sidebar">
        <strong>Solutions Gate CMS</strong>
        <p style={{ opacity: 0.75 }}>{userName}</p>
        <nav aria-label="CMS">
          {items
            .filter(([label]) => label !== 'Users' || isOwner)
            .map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/api/auth/signout">Sign out</Link>
        </nav>
      </aside>
      <main className="admin-main" id="admin-main">{children}</main>
    </div>
  );
}

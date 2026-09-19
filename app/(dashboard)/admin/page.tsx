import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [pages, media, inquiries, users] = await Promise.all([
    db.page.count(),
    db.mediaAsset.count(),
    db.contactSubmission.count(),
    db.user.count()
  ]);

  return (
    <div className="stack">
      <div>
        <div className="badge">CMS</div>
        <h1>Website administration</h1>
        <p>Draft and publication controls are enforced server-side.</p>
      </div>
      <div className="split">
        <div className="admin-card"><strong>{pages}</strong><div>Pages</div></div>
        <div className="admin-card"><strong>{media}</strong><div>Media assets</div></div>
        <div className="admin-card"><strong>{inquiries}</strong><div>Inquiries</div></div>
        <div className="admin-card"><strong>{users}</strong><div>Administrators</div></div>
      </div>
    </div>
  );
}

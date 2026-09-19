import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { MediaUploader } from '@/components/media-uploader';
import { MediaDeleteButton } from '@/components/media-delete-button';

export const dynamic = 'force-dynamic';

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await requireAdmin();
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const q = (query.q ?? '').trim();
  const where = q ? { originalFilename: { contains: q, mode: 'insensitive' as const } } : {};
  const [media, count] = await Promise.all([
    db.mediaAsset.findMany({ where, include: { translations: true, usages: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 25, take: 25 }),
    db.mediaAsset.count({ where })
  ]);
  return (
    <div className="stack">
      <div><h1>Media</h1><p>Hard deletion is OWNER-only and is blocked while any canonical or MediaUsage reference exists.</p></div>
      <MediaUploader />
      <form method="get" className="admin-card"><label>Search files<input name="q" defaultValue={q} /></label><button className="button secondary">Search</button></form>
      {media.length === 0 ? <div className="admin-card">No media assets found.</div> : <div className="admin-card table-wrap"><table><thead><tr><th>File</th><th>Dimensions</th><th>Localized alt</th><th>Usage</th><th /></tr></thead><tbody>
        {media.map((item) => <tr key={item.id}><td>{item.originalFilename}</td><td>{item.width}×{item.height}</td><td>{item.translations.map((row) => row.locale + ': ' + (row.altText ?? '')).join(' | ')}</td><td>{item.usages.length}</td><td>{session.user.role === 'OWNER' ? <MediaDeleteButton id={item.id} name={item.originalFilename} /> : 'OWNER only'}</td></tr>)}
      </tbody></table></div>}
      <p>Page {page} · {count} total</p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MediaDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    if (!window.confirm(`Delete media “${name}”? This cannot be undone.`)) return;
    setPending(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to delete media.');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete media.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="button danger" type="button" disabled={pending} onClick={remove}>
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {error ? <div role="alert" style={{ marginBlockStart: '.5rem' }}>{error}</div> : null}
    </div>
  );
}

'use client';

import { useState } from 'react';

export function MediaUploader() {
  const [status, setStatus] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Uploading…');
    const response = await fetch('/api/admin/media', {
      method: 'POST',
      body: new FormData(event.currentTarget)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload.error || 'Upload failed.');
      return;
    }
    setStatus('Upload complete. Refreshing…');
    window.location.reload();
  }

  return (
    <form className="form-grid admin-card" onSubmit={submit}>
      <label>
        Image
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required />
      </label>
      <div className="split">
        <label>English alt text<input name="altEn" required /></label>
        <label>Arabic alt text<input name="altAr" required /></label>
      </div>
      <button className="button" type="submit">Upload media</button>
      {status ? <p role="status">{status}</p> : null}
    </form>
  );
}

'use client';
import { useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import { emptyPhoto, type ContentPhoto } from '@/lib/contentSchema';

export default function PhotoField({ label, value, onChange, portrait = false }: { portrait?: boolean; label: string; value: ContentPhoto; onChange: (photo: ContentPhoto) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(file?: File) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) { setError('Choose JPEG, PNG or WebP, up to 4 MB.'); return; }
    setBusy(true); setError('');
    try {
      const form = new FormData(); form.append('file', file);
      const res = await adminFetch('/api/admin/uploads', { method: 'POST', body: form });
      const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Upload failed');
      onChange({ ...value, url: body.url });
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); }
  }
  return <fieldset className="space-y-3 rounded-xl border border-sand p-4">
    <legend className="px-2 font-medium">{label}</legend>
    {value.url ? <><img src={value.url} alt={value.alt || 'Uploaded photo preview'} className="max-h-56 w-full object-contain" /><button type="button" className="underline" onClick={() => onChange({ ...emptyPhoto })}>Remove photo from this content</button></> : <p className="text-earth-mid">No photo uploaded. This photo is hidden on the public website.</p>}
    <label className="block">{busy ? 'Uploading…' : value.url ? 'Replace photo' : 'Upload photo'}<input aria-label={`Upload ${label}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => void upload(e.target.files?.[0])} className="block w-full mt-2" /></label>
    <p className="text-sm text-earth-mid">JPEG, PNG or WebP · up to 4 MB. Photos are resized without cropping and stored securely.</p>
    <label className="block">Alt text<input className="editor-input" readOnly={portrait} value={value.alt} onChange={e => onChange({ ...value, alt: e.target.value })} /></label>
    {!portrait && <label className="block">Caption<input className="editor-input" value={value.caption} onChange={e => onChange({ ...value, caption: e.target.value })} /></label>}
    <label className="flex gap-2"><input type="checkbox" checked={value.consent} onChange={e => onChange({ ...value, consent: e.target.checked })} />Consent for public display has been confirmed</label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </fieldset>;
}

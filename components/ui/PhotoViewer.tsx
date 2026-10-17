'use client';
import { useRef, useState } from 'react';
import type { ContentPhoto } from '@/lib/contentSchema';

export default function PhotoViewer({ photo, eager = false }: { photo: ContentPhoto; eager?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState('');
  if (!photo.url || failedUrl === photo.url) return null;
  return <figure>
    <button ref={trigger} type="button" className="block w-full cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-terracotta" aria-label={`Enlarge photo: ${photo.alt}`} onClick={() => { setOpen(true); dialog.current?.showModal(); }}>
      <img src={photo.url} alt={photo.alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" onError={() => setFailedUrl(photo.url)} className="w-full h-auto max-h-[650px] object-contain rounded-xl bg-sand/30" />
    </button>
    {photo.caption && <figcaption className="text-sm text-earth-mid mt-3 leading-relaxed">{photo.caption}</figcaption>}
    <dialog ref={dialog} className="photo-dialog" onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <button autoFocus type="button" aria-label="Close photo" className="absolute right-4 top-4 z-10 bg-earth-dark text-white px-4 py-2 rounded-lg" onClick={() => dialog.current?.close()}>Close ×</button>
      {open && <img src={photo.url} alt={photo.alt} className="max-w-full max-h-[85vh] object-contain" />}
    </dialog>
  </figure>;
}

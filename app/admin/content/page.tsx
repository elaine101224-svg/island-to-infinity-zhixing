'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import { useToast } from '@/components/admin/Toast';
import PhotoField from '@/components/admin/PhotoField';
import { defaultHomepage, emptyPhoto, type HomepageContent, type PublicCard } from '@/lib/contentSchema';
import type { ActivityRecord } from '@/types';

export default function ContentEditor() {
  const toast = useToast();
  const [content, setContent] = useState<HomepageContent>(defaultHomepage);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [published, setPublished] = useState(false);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch('/api/admin/content'); if (!res.ok) throw new Error('Unable to load saved content. Retry this page.');
        const state = await res.json(); setContent(state.draft); setRevision(state.revision); setPublished(!!state.published); setLoaded(true);
        const activityRes = await adminFetch('/api/admin/activities'); if (activityRes.ok) setActivities(await activityRes.json());
      } catch (e) { setError(e instanceof Error ? e.message : 'Load failed'); }
    } void load();
  }, []);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) { if (dirty) e.preventDefault(); }
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function edit(next: HomepageContent) { setContent(next); setDirty(true); }
  async function save(action: 'save' | 'publish' | 'unpublish') {
    setBusy(true); setError('');
    try {
      const res = await adminFetch('/api/admin/content', { method:'PUT', json:{ action,revision,content } });
      const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Save failed');
      setRevision(body.revision); setDirty(false); if (action !== 'save') setPublished(action === 'publish'); toast.success(body.message);
    } catch (e) { const message = e instanceof Error ? e.message : 'Save failed'; setError(message); toast.error(message); } finally { setBusy(false); }
  }
  function cardEdit(id: string, patch: Partial<PublicCard>) { edit({ ...content, cards:content.cards.map(c => c.id === id ? {...c,...patch} : c) }); }
  if (!loaded) return <div role="status">{error || 'Loading website content…'}</div>;
  return <div className="max-w-5xl mx-auto space-y-6">
    <header><h1 className="font-serif text-3xl">Website Content / Homepage</h1><p className="text-earth-mid mt-2">Draft changes are private until you publish. Publishing also snapshots only explicitly public members for the selected school year.</p></header>
    <div className="sticky top-0 z-20 bg-cream border border-sand rounded-xl p-4 flex flex-wrap items-center gap-3">
      <span role="status" className="mr-auto">{dirty ? 'Unsaved changes' : 'Draft saved'} · {published ? 'Live version published' : 'No published version'}</span>
      <button className="editor-button" disabled={busy} onClick={() => void save('save')}>Save draft</button>
      {!dirty && <Link href="/admin/content/preview" target="_blank" className="underline">Preview saved draft ↗</Link>}
      <button className="editor-button bg-terracotta-dark" disabled={busy} onClick={() => void save('publish')}>Publish website</button>
      {published && <button className="underline text-sm" disabled={busy} onClick={() => void save('unpublish')}>Unpublish</button>}
    </div>
    {error && <p role="alert" className="p-4 bg-red-50 text-red-800 rounded-lg">{error}</p>}
    <section className="editor-panel space-y-4"><h2 className="font-serif text-2xl">Introduction</h2>
      <label className="block">Title<input className="editor-input" value={content.title} onChange={e => edit({...content,title:e.target.value})} /></label>
      <label className="block">Short introduction<textarea className="editor-input" rows={3} value={content.intro} onChange={e => edit({...content,intro:e.target.value})} /></label>
      <div className="grid sm:grid-cols-2 gap-4"><label>Current school year (e.g. 2026–27)<input className="editor-input" value={content.schoolYear} onChange={e => edit({...content,schoolYear:e.target.value.replace('-', '–')})} /></label><label>Founding year<input className="editor-input" value={content.foundingYear} onChange={e => edit({...content,foundingYear:e.target.value})} /></label></div>
      <label className="block">About<textarea className="editor-input" rows={4} value={content.about} onChange={e => edit({...content,about:e.target.value})} /></label>
    </section>
    <section className="editor-panel space-y-4"><h2 className="font-serif text-2xl">Current team photograph · {content.schoolYear}</h2><PhotoField label="Full team photograph" value={content.teamPhoto} onChange={photo => edit({...content,teamPhoto:photo})} /><label className="block">Display position<select className="editor-input" value={content.photoPosition} onChange={e => edit({...content,photoPosition:e.target.value as 'hero'|'team'})}><option value="hero">First screen, below introduction</option><option value="team">Our Team section</option></select></label><p className="text-earth-mid">Photos always fit in full, without cropping. Manage individual public names and roles under <Link className="underline" href="/admin/team">Team</Link>, then publish here.</p></section>
    <section className="editor-panel space-y-4"><h2 className="font-serif text-2xl">Zhixing documentary</h2><label className="block">Stored video URL<input className="editor-input" value={content.documentary.url} onChange={e=>edit({...content,documentary:{...content.documentary,url:e.target.value}})} placeholder="/api/media/…" /></label><label className="block">Video title<input className="editor-input" value={content.documentary.title} onChange={e=>edit({...content,documentary:{...content.documentary,title:e.target.value}})} /></label><label className="block">Caption<textarea className="editor-input" value={content.documentary.caption} onChange={e=>edit({...content,documentary:{...content.documentary,caption:e.target.value}})} /></label><label className="block"><input type="checkbox" checked={content.documentary.consent} onChange={e=>edit({...content,documentary:{...content.documentary,consent:e.target.checked}})} /> Public-display authorization confirmed for the complete documentary</label><p className="text-earth-mid">Clear the URL and publish to remove the video. Withdrawing authorization blocks new playback links; existing links expire within two minutes.</p></section>
    <section className="editor-panel space-y-6"><h2 className="font-serif text-2xl">Four family groups</h2><p className="text-earth-mid">Group names are public labels. Do not include family addresses or private details. Coordinator and member names come only from approved public Team profiles.</p>
    {content.groups.map((g,i) => <fieldset key={g.id} className="border border-sand rounded-xl p-4 space-y-3"><legend className="px-2">Group {i+1}</legend><div className="flex flex-wrap gap-3"><label><input type="checkbox" checked={g.visible} onChange={e => edit({...content,groups:content.groups.map(x => x.id===g.id?{...x,visible:e.target.checked}:x)})} /> Show this group</label><button type="button" disabled={i===0} className="underline disabled:opacity-30" onClick={() => {const groups=[...content.groups]; [groups[i-1],groups[i]]=[groups[i],groups[i-1]];edit({...content,groups});}}>Move up</button></div><label className="block">Public group name<input className="editor-input" value={g.name} onChange={e => edit({...content,groups:content.groups.map(x=>x.id===g.id?{...x,name:e.target.value}:x)})} /></label><label className="block">Introduction<textarea className="editor-input" value={g.description} onChange={e => edit({...content,groups:content.groups.map(x=>x.id===g.id?{...x,description:e.target.value}:x)})} /></label><PhotoField label={`${g.name} photo`} value={g.photo} onChange={photo => edit({...content,groups:content.groups.map(x=>x.id===g.id?{...x,photo}:x)})} /></fieldset>)}
    </section>
    <section className="editor-panel space-y-5"><h2 className="font-serif text-2xl">Our Journey / historical photographs</h2><p className="text-earth-mid">Photos appear from left to right in this order. Add more entries for any year, then publish your changes.</p>{content.history.map((h,i)=><fieldset key={h.id} className="border border-sand rounded-xl p-4 space-y-3"><label><input type="checkbox" checked={h.visible} onChange={e => edit({...content,history:content.history.map(x=>x.id===h.id?{...x,visible:e.target.checked}:x)})} /> Show historical entry</label><div className="grid sm:grid-cols-2 gap-3"><label>Year<input className="editor-input" value={h.year} onChange={e=>edit({...content,history:content.history.map(x=>x.id===h.id?{...x,year:e.target.value}:x)})} /></label><label>Title<input className="editor-input" value={h.title} onChange={e=>edit({...content,history:content.history.map(x=>x.id===h.id?{...x,title:e.target.value}:x)})} /></label></div><PhotoField label={`Historical photo ${i+1}`} value={h.photo} onChange={photo=>edit({...content,history:content.history.map(x=>x.id===h.id?{...x,photo}:x)})} /><div className="flex gap-5"><button type="button" className="min-h-11 underline disabled:opacity-30" disabled={i===0} onClick={()=>{const history=[...content.history];[history[i-1],history[i]]=[history[i],history[i-1]];edit({...content,history});}}>Move up</button><button type="button" className="min-h-11 underline disabled:opacity-30" disabled={i===content.history.length-1} onClick={()=>{const history=[...content.history];[history[i],history[i+1]]=[history[i+1],history[i]];edit({...content,history});}}>Move down</button></div></fieldset>)}<button className="editor-button" onClick={()=>edit({...content,history:[...content.history,{id:crypto.randomUUID(),year:'',title:'',photo:{...emptyPhoto},visible:false}]})}>Add historical entry</button></section>
    <section className="editor-panel space-y-5"><h2 className="font-serif text-2xl">Public updates, Families, Plans & Schedule</h2><p className="text-earth-mid">Write a separate public summary. Internal notes, contact information and addresses are never copied automatically. Only updates linked to completed activity records can be published.</p>
    {content.cards.map(c=><fieldset key={c.id} className="border border-sand rounded-xl p-4 space-y-3"><div className="grid sm:grid-cols-2 gap-4"><label>Page / type<select className="editor-input" value={c.kind} onChange={e=>cardEdit(c.id,{kind:e.target.value as PublicCard['kind']})}><option value="update">Latest update</option><option value="family">Families introduction</option><option value="plan">Public plan</option><option value="event">Public calendar event</option></select></label><label>Date<input type="date" readOnly={c.kind==='update'} className="editor-input" value={c.date} onChange={e=>cardEdit(c.id,{date:e.target.value})} /></label></div>
    {c.kind==='update' && <label className="block">Completed activity record<select className="editor-input" value={c.sourceId} onChange={e=>{const a=activities.find(a=>a.id===e.target.value);cardEdit(c.id,{sourceId:e.target.value,date:a?.date||c.date});}}><option value="">Choose a completed activity</option>{activities.filter(a=>a.date<=new Date().toISOString().slice(0,10)).map(a=><option key={a.id} value={a.id}>{a.date} · {a.title}</option>)}</select></label>}
    {c.kind==='event' && <div className="grid sm:grid-cols-2 gap-4"><label>Event type<select className="editor-input" value={c.eventType||'event'} onChange={e=>cardEdit(c.id,{eventType:e.target.value as PublicCard['eventType']})}><option value="event">Event</option><option value="meeting">Meeting</option><option value="visit">Visit</option><option value="field_trip">Field trip</option></select></label><label>Public venue (leave blank if unconfirmed)<input className="editor-input" value={c.venue||''} onChange={e=>cardEdit(c.id,{venue:e.target.value})} /></label><label>Start time · China time (optional)<input type="time" className="editor-input" value={c.startTime||''} onChange={e=>cardEdit(c.id,{startTime:e.target.value})} /></label><label>End time · China time (optional)<input type="time" className="editor-input" value={c.endTime||''} onChange={e=>cardEdit(c.id,{endTime:e.target.value})} /></label></div>}
    <label className="block">Public title<input className="editor-input" value={c.title} onChange={e=>cardEdit(c.id,{title:e.target.value})} /></label><label className="block">Reviewed public summary<textarea rows={4} className="editor-input" value={c.summary} onChange={e=>cardEdit(c.id,{summary:e.target.value})} /></label><PhotoField label={`${c.title||'Public entry'} photograph`} value={c.photo} onChange={photo=>cardEdit(c.id,{photo})} /><label><input type="checkbox" checked={c.published} onChange={e=>cardEdit(c.id,{published:e.target.checked})} /> Include in next publication</label><button className="block underline text-sm" onClick={()=>edit({...content,cards:content.cards.filter(x=>x.id!==c.id)})}>Remove from draft</button></fieldset>)}
    <button className="editor-button" onClick={()=>edit({...content,cards:[...content.cards,{id:crypto.randomUUID(),kind:'update',sourceId:'',title:'New public entry',summary:'',date:'',photo:{...emptyPhoto},published:false}]})}>Add public entry</button></section>
  </div>;
}

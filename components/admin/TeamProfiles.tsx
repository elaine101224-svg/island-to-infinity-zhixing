'use client';
import {graduationYears} from '@/lib/schoolYear';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import { useToast } from '@/components/admin/Toast';
import PhotoField from '@/components/admin/PhotoField';
import {useUnsavedChanges} from '@/lib/hooks/useUnsavedChanges';
import { currentSchoolYear } from '@/lib/schoolYear';
import type { TeamMember } from '@/types';

type Assignment={id:string;title:string;kind:'family'|'project'};
type DirectoryMember={id:string;assignments:Assignment[]};
type Form = Omit<TeamMember, 'id'|'createdAt'|'updatedAt'>;
const blank = (year:string):Form => ({ graduationYear:null,grade:null,name:'',role:'volunteer',email:'',phone:'',status:'active',assignedFamilyIds:[],joinedDate:'',notes:'',academicYears:[year],publicName:'',publicRole:'',groupId:'',photoUrl:'',photoConsent:false,displayOrder:0,isPublic:false });
export default function TeamProfiles({embedded=false}:{embedded?:boolean}) {
  const Heading=embedded?'h2':'h1';
  const CardHeading=embedded?'h3':'h2';
  const toast=useToast();
  const [members,setMembers]=useState<TeamMember[]>([]);
  const [directory,setDirectory]=useState<DirectoryMember[]>([]);
  const [current,setCurrent]=useState(currentSchoolYear());
  const [year,setYear]=useState(currentSchoolYear());
  const [status,setStatus]=useState('active');
  const [query,setQuery]=useState('');
  const [graduation,setGraduation]=useState('');
  const [group,setGroup]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [editing,setEditing]=useState<TeamMember|null>(null);
  const [form,setForm]=useState<Form|null>(null);
  const [busy,setBusy]=useState(false);
  useUnsavedChanges(!!form);
  useEffect(()=>{async function load(){try{
    const [m,c,d]=await Promise.all([adminFetch('/api/admin/team'),adminFetch('/api/admin/content'),adminFetch('/api/admin/directory')]);
    if(!m.ok||!c.ok||!d.ok) throw new Error('Unable to load the roster. Please reload; no empty roster has been assumed.');
    const directory=await d.json();setDirectory(directory.members);setMembers(await m.json());const content=await c.json();setYear(directory.schoolYear??content.draft.schoolYear);setCurrent(directory.schoolYear??content.draft.schoolYear);
  }catch(e){setError(e instanceof Error?e.message:'Load failed');}finally{setLoading(false);}}void load();},[]);
  const assignments=Array.from(new Map(directory.flatMap(person=>person.assignments).map(scope=>[scope.id,scope])).values());
  function memberAssignments(id:string){return directory.find(person=>person.id===id)?.assignments??[];}
  const unassigned=members.filter(m=>!m.academicYears?.length).length;
  const years=Array.from(new Set([current,...members.flatMap(m=>m.academicYears||[])])).sort().reverse();
  const visible=members.filter(m=>(!graduation||m.graduationYear===graduation)&&(!!graduation||year==='all'||(year==='unassigned'?!m.academicYears?.length:m.academicYears?.includes(year)))&&(status==='all'||m.status===status)&&(!group||directory.find(person=>person.id===m.id)?.assignments.some(scope=>scope.id===group))&&`${m.name} ${m.publicName||''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0)||a.name.localeCompare(b.name));
  function open(member?:TeamMember){setEditing(member||null);setForm(member?{...blank(current),...member}:blank(current));}
  async function save(){if(!form)return;setBusy(true);try{
    const res=await adminFetch(editing?`/api/admin/team/${editing.id}`:'/api/admin/team',{method:editing?'PUT':'POST',json:form});const saved=await res.json();if(!res.ok)throw new Error(saved.error||'Save failed');setMembers(prev=>editing?prev.map(m=>m.id===saved.id?saved:m):[...prev,saved]);toast.success('Member saved. Publish Website Content to update the public team.');setForm(null);
  }catch(e){toast.error(e instanceof Error?e.message:'Save failed');}finally{setBusy(false);}}
  async function archive(m:TeamMember){setBusy(true);try{const res=await adminFetch(`/api/admin/team/${m.id}`,{method:'PUT',json:{...m,status:m.status==='active'?'inactive':'active'}});if(!res.ok)throw new Error('Archive change failed');const saved=await res.json();setMembers(prev=>prev.map(x=>x.id===m.id?saved:x));toast.success('Status updated. History retained; republish Website Content to update the public team.');}catch(e){toast.error(e instanceof Error?e.message:'Update failed');}finally{setBusy(false);}}
  function field<K extends keyof Form>(key:K,value:Form[K]){setForm(prev=>prev?{...prev,[key]:value}:prev);}
  if(loading)return <p role="status">Loading members…</p>;
  if(error)return <p role="alert">{error}</p>;
  return <div className="max-w-6xl mx-auto space-y-6"><header className="flex flex-wrap justify-between gap-4"><div><Heading className={embedded?'text-lg font-semibold':'font-serif text-3xl'}>Profiles &amp; Contacts</Heading><p className="text-earth-mid mt-2">Member profiles, school years and private contact details.</p></div><button className="editor-button" onClick={()=>open()}>Add member</button></header>
    {unassigned>0&&<div className="bg-amber-light/40 p-4 rounded-xl">{unassigned} existing members have no confirmed school year. <button className="underline font-medium" onClick={()=>{setYear('unassigned');setStatus('all');}}>Review unassigned members</button>. Nothing has been inferred from old names or roles.</div>}
    <div className="editor-panel grid sm:grid-cols-2 lg:grid-cols-5 gap-4"><label>School year<select className="editor-input" value={year} onChange={e=>{const selected=e.target.value;setYear(selected);setStatus(selected===current?'active':'all');}}>{years.map(y=><option key={y}>{y}</option>)}<option value="unassigned">Unassigned year</option><option value="all">All years</option></select></label><label>Graduation year<select className="editor-input" value={graduation} onChange={e=>{setGraduation(e.target.value);if(e.target.value)setStatus('all');}}><option value="">All graduation years</option>{Array.from(new Set(members.flatMap(member=>member.graduationYear?[member.graduationYear]:[]))).sort().map(year=><option key={year}>{year}</option>)}</select></label><label>Current status<select className="editor-input" value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Archived</option><option value="all">All statuses</option></select></label><label>Search names<input className="editor-input" type="search" value={query} onChange={e=>setQuery(e.target.value)} /></label><label>Family / project<select className="editor-input" value={group} onChange={e=>setGroup(e.target.value)}><option value="">All families &amp; projects</option>{assignments.map(scope=><option key={scope.id} value={scope.id}>{scope.title}</option>)}</select></label></div>
    {year!==current && year!=='all' && year!=='unassigned' && <p className="text-earth-mid">Showing {year} membership, including former leaders. Current status refers to whether someone is active now.</p>}
    <p role="status" className="text-earth-mid">{visible.length} members match these filters. <Link className="underline" href="/admin/content">Publish public team changes in Website Content</Link>.</p>
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{visible.map(m=><article key={m.id} className="editor-panel"><CardHeading className="font-semibold text-lg">{m.name}</CardHeading><p className="text-earth-mid mt-2">Internal: {m.role} · {m.status==='active'?'Active':'Archived'}</p><div className="text-sm mt-3 space-y-1">{(['family','project'] as const).map(kind=><p key={kind}><span className="text-earth-mid">{kind==='family'?'Family':'Projects'}: </span>{memberAssignments(m.id).filter(scope=>scope.kind===kind).map(scope=>scope.title).join(' · ')||'—'}</p>)}</div><p className="text-sm mt-2 font-medium">Graduation: {m.graduationYear||'—'}</p><p className="text-sm mt-2">{m.academicYears?.join(', ')||'School year unassigned'}</p><p className="text-sm text-earth-mid mt-2">{m.isPublic?'Selected for next public snapshot':'Private profile'}{m.publicRole?` · ${m.publicRole}`:''}</p><div className="flex gap-4 mt-4"><button className="underline" onClick={()=>open(m)}>Edit</button><button disabled={busy} className="underline" onClick={()=>void archive(m)}>{m.status==='active'?'Archive':'Reactivate'}</button></div></article>)}</div>{!visible.length&&<p className="editor-panel">No members match these filters. Check the unassigned-year list before creating duplicates.</p>}
    {form&&<div className="fixed inset-0 z-50 bg-earth-dark/50 p-3 flex items-center justify-center" onKeyDown={e=>{if(e.key==='Escape'&&!busy)setForm(null);}}><section role="dialog" aria-modal="true" aria-labelledby="member-title" className="bg-cream rounded-xl p-5 max-w-2xl w-full max-h-[92vh] overflow-auto"><div className="flex justify-between mb-5"><h2 id="member-title" className="font-serif text-2xl">{editing?'Edit member':'Add member'}</h2><button aria-label="Close member editor" onClick={()=>setForm(null)}>Close ×</button></div><div className="space-y-5">
      <label className="block">Internal name<input autoFocus className="editor-input" value={form.name} onChange={e=>field('name',e.target.value)} /></label>
      <div className="grid sm:grid-cols-2 gap-4"><label>Internal management role<select className="editor-input" value={form.role} onChange={e=>field('role',e.target.value as Form['role'])}><option value="lead">Lead</option><option value="coordinator">Coordinator</option><option value="volunteer">Volunteer</option></select></label><label>Status<select className="editor-input" value={form.status} onChange={e=>field('status',e.target.value as Form['status'])}><option value="active">Active</option><option value="inactive">Archived</option></select></label></div>
      <label className="block">Confirmed school years (comma separated; retain previous years)<input className="editor-input" value={form.academicYears?.join(', ')||''} placeholder="2026–27, 2025–26" onChange={e=>field('academicYears',e.target.value.split(',').map(v=>v.trim().replace('-','–')).filter(Boolean))} /></label>
      <label className="block">Graduation year<select className="editor-input" value={form.graduationYear??''} onChange={e=>field('graduationYear',e.target.value||null)}><option value="">Choose graduation year</option>{graduationYears(members).map(year=><option key={year}>{year}</option>)}</select></label>
      <div className="text-sm"><p className="font-medium">Family &amp; project assignments</p><p className="mt-1">{editing?memberAssignments(editing.id).map(scope=>scope.title).join(' · ')||'—':'Save this member before assigning a family or project.'}</p><Link href="/admin/tasks" className="inline-block min-h-11 py-3 underline">Manage team assignments</Link></div>
      <fieldset className="editor-panel space-y-4"><legend className="font-semibold">Public profile · independent from internal records</legend><label className="block">Public display name<input className="editor-input" value={form.publicName||''} onChange={e=>field('publicName',e.target.value)} /></label><label className="block">Public role (e.g. Group coordinator)<input className="editor-input" value={form.publicRole||''} onChange={e=>field('publicRole',e.target.value)} /></label><label className="block">Display order<input type="number" min={0} max={9999} className="editor-input" value={form.displayOrder||0} onChange={e=>field('displayOrder',Number(e.target.value))} /></label><PhotoField portrait label="Member portrait (optional)" value={{url:form.photoUrl||'',alt:form.publicName||'',caption:'',consent:form.photoConsent||false}} onChange={p=>setForm(prev=>prev?{...prev,photoUrl:p.url,photoConsent:p.consent}:prev)} /><label className="flex gap-2"><input type="checkbox" checked={!!form.isPublic} onChange={e=>field('isPublic',e.target.checked)} />Approve this profile for public display in its confirmed school year</label><p className="text-sm text-earth-mid">Save, then preview and publish Website Content. Email, phone, notes and family assignments stay private.</p></fieldset>
      <div className="grid sm:grid-cols-2 gap-4"><label>Private email<input type="email" className="editor-input" value={form.email} onChange={e=>field('email',e.target.value)} /></label><label>Private phone<input className="editor-input" value={form.phone} onChange={e=>field('phone',e.target.value)} /></label></div><label className="block">Joined date (optional)<input type="date" className="editor-input" value={form.joinedDate} onChange={e=>field('joinedDate',e.target.value)} /></label>
      <label className="block">Private notes<textarea className="editor-input" value={form.notes} onChange={e=>field('notes',e.target.value)} /></label><button className="editor-button w-full" disabled={busy||!form.name.trim()} onClick={()=>void save()}>{busy?'Saving…':'Save member'}</button>
    </div></section></div>}
  </div>;
}

'use client';
import {useState} from 'react';
import {adminFetch} from '@/lib/adminFetch';
import type {Term} from '@/lib/term/schema';

export default function ScopeMembers({document,revision,initialScope,onSaved}:{document:Term;revision:number;initialScope:string;onSaved:(scopeId?:string)=>Promise<void>}){
 const [creating,setCreating]=useState(false),[newTitle,setNewTitle]=useState(''),[newKind,setNewKind]=useState<'family'|'project'>('project'),[coordinators,setCoordinators]=useState<string[]>([]);
 const [editing,setEditing]=useState<string|null>(null),[members,setMembers]=useState<string[]>([]),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [editingRevision,setEditingRevision]=useState(revision);
 const scopes=document.scopes??[];
 const current=scopes.find(scope=>scope.id===editing);
 function edit(id:string){const scope=scopes.find(scope=>scope.id===id);if(!scope)return;setCoordinators([...scope.coordinatorIds]);setEditing(id);setEditingRevision(revision);setMembers([...new Set([...scope.memberIds,...scope.coordinatorIds])]);setQuery('');setError('');}
 async function save(){if(!current)return;setBusy(true);setError('');try{
  const response=await adminFetch('/api/admin/member-tasks',{method:'POST',json:{revision:editingRevision,membership:{scopeId:current.id,memberIds:members,coordinatorIds:coordinators}}});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  setEditing(null);await onSaved();
 }catch(cause){setError((cause as Error).message);}finally{setBusy(false);}}
 async function create(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{const id=crypto.randomUUID();const response=await adminFetch('/api/admin/member-tasks',{method:'POST',json:{revision,createScope:{id,title:newTitle,kind:newKind}}});const data=await response.json();if(!response.ok)throw Error(data.error);setCreating(false);setNewTitle('');await onSaved(id);}catch(cause){setError((cause as Error).message);}finally{setBusy(false);}}
 return <section className="console-panel"  data-static-section="true">
  <div className="cursor-pointer min-h-14 px-5 py-4 text-sm font-semibold" data-section-heading="true">Family & project members</div>
  <div className="px-5 pb-5 space-y-4">
   <p className="text-sm text-earth-mid">Add or remove people from each team. Existing task assignments and progress are kept; update task assignees separately when needed.</p>
   <button type="button" className="min-h-11 text-sm underline" disabled={busy||!!editing} onClick={()=>setCreating(value=>!value)}>Add family / project</button>
   {creating&&<form onSubmit={create} className="space-y-3"><fieldset disabled={busy} className="space-y-3"><label className="block text-sm">Type<select className="editor-input" value={newKind} onChange={event=>setNewKind(event.target.value as typeof newKind)}><option value="project">Project</option><option value="family">Family</option></select></label><label className="block text-sm">Team name<input className="editor-input" required maxLength={200} value={newTitle} onChange={event=>setNewTitle(event.target.value)}/></label><button type="submit" className="editor-button">{busy?'Creating…':'Create team'}</button></fieldset></form>}
   {error&&<p role="alert" className="text-sm text-terracotta-dark">{error}</p>}
   {current?<form onSubmit={event=>{event.preventDefault();void save();}}><fieldset disabled={busy} className="space-y-4">
    <legend className="font-semibold">{current.title} · {members.length} members</legend>
    <label className="block text-sm">Search people<input type="search" className="editor-input" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <div className="max-h-72 overflow-y-auto grid sm:grid-cols-2 gap-x-4">{document.people.filter(person=>person.name.toLowerCase().includes(query.trim().toLowerCase())).map(person=><div key={person.id} className="flex flex-wrap items-center gap-x-4 py-1"><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={members.includes(person.id)} onChange={event=>{setMembers(ids=>event.target.checked?[...ids,person.id]:ids.filter(id=>id!==person.id));if(!event.target.checked)setCoordinators(ids=>ids.filter(id=>id!==person.id));}}/>{person.name}</label><label className="flex min-h-11 items-center gap-2 text-xs text-earth-mid"><input type="checkbox" disabled={!members.includes(person.id)} checked={coordinators.includes(person.id)} onChange={event=>setCoordinators(ids=>event.target.checked?[...ids,person.id]:ids.filter(id=>id!==person.id))}/>Coordinator</label></div>)}</div>
    {!document.people.some(person=>person.name.toLowerCase().includes(query.trim().toLowerCase()))&&<p className="text-sm text-earth-mid">No matching people.</p>}
    <p className="text-xs text-earth-mid">Removing a coordinator also removes their coordination role for this team. Team membership does not confirm event attendance.</p>
    <div className="flex gap-4"><button className="editor-button" type="submit">{busy?'Saving…':'Save members'}</button><button type="button" className="min-h-11 text-sm underline" onClick={()=>setEditing(null)}>Cancel</button></div>
   </fieldset></form>:<div className="divide-y divide-sand">{scopes.filter(scope=>!initialScope||scope.id===initialScope).map(scope=><div key={scope.id} className="flex items-center justify-between gap-4 py-3"><div><h2 className="text-sm font-semibold">{scope.title}</h2><p className="text-xs text-earth-mid mt-1">{scope.kind==='family'?'Family':'Project'} · {[...new Set([...scope.memberIds,...scope.coordinatorIds])].map(id=>document.people.find(person=>person.id===id)?.name??id).join(' · ')||'No members'}</p></div><button type="button" className="shrink-0 min-h-11 text-sm underline" aria-label={`Edit members of ${scope.title}`} onClick={()=>edit(scope.id)}>Edit members</button></div>)}{!scopes.length&&<p className="text-sm text-earth-mid">No families or projects linked yet.</p>}</div>}
  </div>
 </section>;
}

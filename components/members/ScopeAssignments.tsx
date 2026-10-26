'use client';
import {useState} from 'react';
import {Plus,Users} from 'lucide-react';
import {memberRequest} from '@/lib/members/client';
import {deadlineLabel,statusLabel,type Workspace,type MemberTask} from '@/lib/members/workspace';

type Scope=Workspace['scopes'][number];
function AssignmentForm({scope,workspace,task,onSaved,onCancel}:{scope:Scope;workspace:Workspace;task:MemberTask|null;onSaved:(task:MemberTask)=>void;onCancel:()=>void}){
 const [id]=useState(()=>crypto.randomUUID()),[title,setTitle]=useState(''),[deliverable,setDeliverable]=useState(''),[owners,setOwners]=useState<string[]>(task?[task.ownerId,...(task.collaboratorIds??[])].filter((id):id is string=>!!id):[]),[date,setDate]=useState(''),[time,setTime]=useState(''),[priority,setPriority]=useState('Normal'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const members=workspace.roster.filter(person=>[...scope.memberIds,...scope.coordinatorIds].includes(person.person_id)&&workspace.assignmentMemberIds?.includes(person.person_id));
 const dirty=!!(title||deliverable||owners.length||date);
 async function submit(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError('');try{const result=await memberRequest('coordinator-tasks',task?{action:'reassign',payload:{id:task.id,expectedUpdatedAt:task.updatedAt,ownerIds:owners}}:{action:'create',payload:{id,scopeId:scope.id,title,deliverable,ownerIds:owners,due:date||null,dueAt:date&&time?new Date(`${date}T${time}:00+08:00`).toISOString():null,priority}});onSaved(result.record);}catch(cause){setError((cause as Error).message);}finally{setBusy(false);}}
 return <form onSubmit={submit} className="member-assignment-form" data-member-dirty={dirty?'true':undefined}>
  <h5 className="text-sm font-semibold">{task?'Reassign task':'New team task'}</h5>{task&&<p className="text-sm mt-2">{task.title}</p>}
  <fieldset disabled={busy} className="space-y-4 mt-4">
   {!task&&<><label className="block text-sm">Task title<input className="editor-input" required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="block text-sm">What should be delivered?<textarea className="editor-input" required rows={3} maxLength={2000} value={deliverable} onChange={e=>setDeliverable(e.target.value)} placeholder="Describe the result the team should submit."/></label></>}
   <fieldset><legend className="text-sm font-medium mb-2">Assign to</legend><div className="space-y-1 max-h-56 overflow-y-auto rounded-lg border border-sand p-2">{members.length?members.map(person=><label key={person.person_id} className="flex items-center gap-3 min-h-11 px-2 text-sm"><input type="checkbox" className="size-4 shrink-0" checked={owners.includes(person.person_id)} onChange={e=>setOwners(ids=>e.target.checked?[...ids,person.person_id]:ids.filter(id=>id!==person.person_id))}/>{person.person_id===workspace.me.personId?<span className="member-you">You</span>:person.name}</label>):<p className="text-sm text-earth-mid p-2">No eligible linked members. Contact Elaine.</p>}</div><p className="text-xs text-earth-mid mt-2">Choose one or more members. Shared work stays in one task.</p></fieldset>
   {!task&&<><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Due date (optional)<input className="editor-input" type="date" min="2020-01-01" max="2100-01-01" value={date} onChange={e=>{setDate(e.target.value);if(!e.target.value)setTime('');}}/></label><label className="text-sm">Time (optional)<input className="editor-input" type="time" value={time} disabled={!date||busy} onChange={e=>setTime(e.target.value)}/></label></div><div className="flex flex-wrap items-end justify-between gap-3"><label className="text-sm">Priority<select className="editor-input" value={priority} onChange={e=>setPriority(e.target.value)}><option>Normal</option><option>High</option></select></label><p className="text-xs text-earth-mid pb-3">Asia/Shanghai · Leave dates empty if unconfirmed.</p></div></>}
   {error&&<p role="alert" className="text-sm text-terracotta-dark">{error}</p>}
   <div className="flex items-center gap-4"><button type="submit" className="editor-button" disabled={!owners.length||busy}>{busy?'Assigning…':'Assign task'}</button><button type="button" className="text-sm underline min-h-11" onClick={()=>{if(!dirty||window.confirm('Discard this assignment draft?'))onCancel();}}>Cancel</button></div>
  </fieldset>
 </form>;
}
export default function ScopeAssignments({scope,workspace,onSaved}:{scope:Scope;workspace:Workspace;onSaved:(task:MemberTask)=>void}){
 const [draft,setDraft]=useState<MemberTask|null|undefined>(undefined),[notice,setNotice]=useState('');
 const tasks=(workspace.teamTasks??[]).filter(task=>task.scopeId===scope.id).toSorted((a,b)=>(a.due??'9999').localeCompare(b.due??'9999'));
 const name=(id:string|null)=>workspace.roster.find(person=>person.person_id===id)?.name??'Member';
 return <section className="member-team-work" aria-label={`${scope.title} team tasks`}>
  <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-semibold flex items-center gap-2"><Users size={16} aria-hidden="true"/>Team tasks <span className="text-xs font-normal text-earth-mid">{tasks.length}</span></h4><button type="button" className="text-sm min-h-11 inline-flex items-center gap-1.5 underline underline-offset-4" disabled={draft!==undefined} onClick={()=>setDraft(null)}><Plus size={15} aria-hidden="true"/>Assign task</button></div>
  {notice&&<p role="status" className="text-xs text-earth-mid mb-2">{notice}</p>}
  {draft!==undefined&&<AssignmentForm key={draft?.id??'new'} scope={scope} workspace={workspace} task={draft} onSaved={record=>{onSaved(record);setDraft(undefined);setNotice('Task assigned. Members can see it in their workspace.');}} onCancel={()=>setDraft(undefined)}/>}
  {tasks.length?<ul className="divide-y divide-sand/70">{tasks.map(task=><li key={task.id} className="py-3"><p className="text-sm font-medium">{task.title}</p><p className="text-xs text-earth-mid mt-1 leading-5">{[task.ownerId,...(task.collaboratorIds??[])].filter(Boolean).map(id=>id===workspace.me.personId?'You':name(id)).join(' · ')}</p><div className="flex flex-wrap items-center justify-between gap-2 mt-1"><p className="text-xs text-earth-mid">{statusLabel(task.status)} · {deadlineLabel(task)}</p><button type="button" className="text-xs underline underline-offset-4 min-h-11" disabled={draft!==undefined} onClick={()=>setDraft(task)}>Reassign</button></div>{task.deliverable&&<p className="text-xs text-earth-mid leading-relaxed whitespace-pre-wrap">{task.deliverable}</p>}</li>)}</ul>:<p className="text-xs text-earth-mid py-3">No team tasks yet. Assign the first next step when your team is ready.</p>}
 </section>;
}

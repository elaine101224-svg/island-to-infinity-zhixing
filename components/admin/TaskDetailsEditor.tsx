'use client';
import {useState} from 'react';
import {useUnsavedChanges} from '@/lib/hooks/useUnsavedChanges';
import {adminFetch} from '@/lib/adminFetch';
import type {MemberTask} from '@/lib/members/workspace';

export default function TaskDetailsEditor({task,revision,onSaved,onCancel}:{task:MemberTask;revision:number;onSaved:()=>Promise<void>;onCancel:()=>void}){
 const [title,setTitle]=useState(task.title),[deliverable,setDeliverable]=useState(task.deliverable||task.nextStep),[timingNote,setTimingNote]=useState(task.timingNote??''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dirty=title!==task.title||deliverable!==(task.deliverable||task.nextStep)||timingNote!==(task.timingNote??'');
 useUnsavedChanges(dirty);
 async function save(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{
  const response=await adminFetch('/api/admin/member-tasks',{method:'POST',json:{revision,ids:[task.id],patch:{title,deliverable,timingNote}}});
  const result=await response.json();if(!response.ok)throw Error(result.error);await onSaved();
 }catch(cause){setError((cause as Error).message);}finally{setBusy(false);}}
 return <form className="space-y-4" onSubmit={save} data-member-dirty={dirty?'true':undefined}><fieldset disabled={busy} className="space-y-4"><legend className="font-semibold text-sm">Edit task details</legend><label className="block text-sm">Title<input className="editor-input" required maxLength={200} value={title} onChange={event=>setTitle(event.target.value)}/></label><label className="block text-sm">What to do / expected result<textarea className="editor-input" rows={4} required maxLength={2000} value={deliverable} onChange={event=>setDeliverable(event.target.value)}/></label><label className="block text-sm">Timing note (optional)<textarea className="editor-input" rows={2} maxLength={2000} value={timingNote} onChange={event=>setTimingNote(event.target.value)}/></label><div className="flex gap-4"><button className="editor-button" type="submit">{busy?'Saving…':'Save details'}</button><button className="min-h-11 underline text-sm" type="button" onClick={onCancel}>Cancel</button></div></fieldset>{error&&<p role="alert" className="text-sm text-terracotta-dark">{error}</p>}</form>;
}

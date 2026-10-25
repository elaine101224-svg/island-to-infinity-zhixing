'use client';

import {Home,Layers} from 'lucide-react';
import MemberTaskRow from './MemberTaskRow';
import type {MemberTask,Workspace} from '@/lib/members/workspace';

export default function MemberScopeGrid({kind,workspace,tasks,done,onSaved,onPrepare}:{kind:'family'|'project';workspace:Workspace;tasks:MemberTask[];done:boolean;onSaved:(task:MemberTask)=>void;onPrepare:(task:MemberTask)=>void}){
 const scopes=workspace.scopes.filter(scope=>scope.kind===kind);
 const Icon=kind==='family'?Home:Layers;
 return <section aria-labelledby={`${kind}-heading`} className="space-y-4">
  <div className="flex items-center gap-2.5"><Icon size={19} className="text-earth-mid" aria-hidden="true"/><h2 id={`${kind}-heading`} className="text-lg font-semibold">{kind==='family'?'Family Plan':'My Projects'}</h2></div>
  {scopes.length?<div className={`grid items-start gap-5 ${kind==='project'?'xl:grid-cols-2':''}`}>{scopes.map(scope=>{
   const roles=workspace.responsibilities.filter(role=>role.scopeId===scope.id);
   const assigned=tasks.filter(task=>task.scopeId===scope.id||(!task.scopeId&&!!task.projectId&&task.projectId===scope.id));
   const coordinator=scope.coordinatorIds.includes(workspace.me.personId);
   return <article key={scope.id} className="min-w-0 rounded-xl border border-sand bg-white" aria-labelledby={`scope-${scope.id}`}>
    <div className="px-5 pt-5 pb-4 sm:px-6">
     <div className="flex items-start justify-between gap-3"><h3 id={`scope-${scope.id}`} className="text-base font-semibold leading-6 break-words">{scope.title}</h3><span className="shrink-0 rounded-md bg-sage-light/40 px-2 py-1 text-xs text-earth-dark">{coordinator?'Coordinator':'Assigned'}</span></div>
     <div className="mt-3 space-y-2">{roles.length?roles.map(role=><p key={role.id} className="text-sm text-earth-mid leading-relaxed max-w-prose">{role.description}</p>):<p className="text-sm text-earth-mid leading-relaxed">{kind==='family'?'家庭内具体职责待Elaine安排。':'已参与此项目，具体工作待分配。'}</p>}</div>
     <details className="mt-2"><summary className="cursor-pointer text-xs text-earth-mid min-h-9 py-2.5 underline underline-offset-4">{kind==='family'?'Family arrangements & team':'Project team & details'}</summary><div className="space-y-2 pb-2 text-sm text-earth-mid leading-relaxed max-w-prose">{scope.coordinatorIds.length>0&&<p><span className="font-medium text-earth-dark">Coordinators: </span>{scope.coordinatorIds.map(id=>workspace.roster.find(person=>person.person_id===id)?.name??'Account link pending').join(' · ')}</p>}<p><span className="font-medium text-earth-dark">Team: </span>{scope.memberIds.map(id=>workspace.roster.find(person=>person.person_id===id)?.name??'Account link pending').join(' · ')}</p><p>{scope.note}</p></div></details>
    </div>
    <div className="border-t border-sand"><div className="px-5 sm:px-6 pt-3 text-xs font-medium text-earth-mid">{done?'Completed tasks':'Specific tasks'}{assigned.length?` · ${assigned.length}`:''}</div>{assigned.length?<div className="divide-y divide-sand">{assigned.map(task=><MemberTaskRow key={task.id+task.updatedAt} compact task={task} workspace={workspace} onSaved={onSaved} onPrepare={()=>onPrepare(task)}/>)}</div>:<p className="px-5 sm:px-6 pt-3 pb-5 text-sm text-earth-mid">{done?'No completed tasks yet.':kind==='project'?'项目分工已确认；具体个人任务待安排。':'家庭分工见上方；具体行动待安排。'}</p>}</div>
   </article>;
  })}</div>:<p className="text-sm text-earth-mid py-3">{kind==='family'?'No family assigned.':'No projects assigned yet.'}</p>}
 </section>;
}

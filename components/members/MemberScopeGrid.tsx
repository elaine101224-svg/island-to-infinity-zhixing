'use client';

import {Home,Layers,BookOpen,Camera,ShoppingBag,HeartHandshake,Scissors,Clapperboard,UserRound} from 'lucide-react';
import MemberTaskRow from './MemberTaskRow';
import type {MemberTask,Workspace} from '@/lib/members/workspace';
const icons={library:BookOpen,booth:Camera,market:ShoppingBag,bullying:HeartHandshake,education:HeartHandshake,sewing:Scissors,documentary:Clapperboard};
const tones:Record<string,string>={library:'sage',education:'sage',bullying:'sage',booth:'amber',market:'amber',sewing:'clay',documentary:'clay'};
export default function MemberScopeGrid({kind,workspace,tasks,done,onSaved,onPrepare}:{kind:'family'|'project';workspace:Workspace;tasks:MemberTask[];done:boolean;onSaved:(task:MemberTask)=>void;onPrepare:(task:MemberTask)=>void}){
 const scopes=workspace.scopes.filter(scope=>scope.kind===kind),SectionIcon=kind==='family'?Home:Layers;
 function people(ids:string[]){return <div className="member-people">{ids.map(id=>id===workspace.me.personId?<span key={id} className="member-you" aria-label={`You, ${workspace.me.name}`}><UserRound size={13} aria-hidden="true"/>You</span>:<span key={id} className="member-person">{workspace.roster.find(person=>person.person_id===id)?.name??'Account link pending'}</span>)}</div>;}
 return <section aria-labelledby={`${kind}-heading`} className="member-scope-section" data-kind={kind}>
  <div className="member-section-heading"><span className="member-section-icon"><SectionIcon size={19} aria-hidden="true"/></span><div><h2 id={`${kind}-heading`}>{kind==='family'?'Family Plan':'My Projects'}</h2><p>{kind==='family'?'The families you support':'Your confirmed project assignments'}</p></div><span className="member-section-count">{scopes.length}</span></div>
  {scopes.length?<div className={`grid items-start gap-5 ${kind==='project'?'xl:grid-cols-2':''}`}>{scopes.map(scope=>{
   const roles=workspace.responsibilities.filter(role=>role.scopeId===scope.id),assigned=tasks.filter(task=>task.scopeId===scope.id||(!task.scopeId&&!!task.projectId&&task.projectId===scope.id));
   const coordinator=scope.coordinatorIds.includes(workspace.me.personId),team=scope.memberIds.filter(id=>!scope.coordinatorIds.includes(id)),Icon=kind==='family'?Home:icons[scope.id as keyof typeof icons]??Layers;
   return <article key={scope.id} className="member-scope-card" data-tone={kind==='family'?'clay':tones[scope.id]??'sage'} aria-labelledby={`scope-${scope.id}`}>
    <div className="member-scope-heading"><span className="member-scope-icon"><Icon size={19} aria-hidden="true"/></span><h3 id={`scope-${scope.id}`}>{scope.title}</h3><span className="member-assignment-badge">{coordinator?'Coordinator':'Assigned'}</span></div>
    <div className="member-scope-content"><div className="space-y-2">{roles.length?roles.map(role=><p key={role.id} className="text-sm text-earth-mid leading-relaxed max-w-prose">{role.description}</p>):<p className="text-sm text-earth-mid leading-relaxed">{kind==='family'?'Your family role is to be agreed with the coordinators.':'Your project participation is confirmed. Specific work is to be agreed.'}</p>}</div>
     <dl className="member-team-list">{scope.coordinatorIds.length>0&&<div><dt>Coordinators</dt><dd>{people(scope.coordinatorIds)}</dd></div>}{team.length>0&&<div><dt>Team</dt><dd>{people(team)}</dd></div>}</dl>
     <p className="member-scope-note">{scope.note}</p>
    </div>
    <div className="member-scope-tasks"><div className="member-task-heading"><h4>{done?'Completed tasks':'Your tasks'}</h4>{assigned.length>0&&<span>{assigned.length}</span>}</div>{assigned.length?<div className="divide-y divide-sand/70">{assigned.map(task=><MemberTaskRow key={task.id+task.updatedAt} compact task={task} workspace={workspace} onSaved={onSaved} onPrepare={()=>onPrepare(task)}/>)}</div>:<p className="member-empty-tasks">{done?'No completed tasks yet.':scope.id==='jingyi'?'Temporary family assignment. No tasks are assigned.':'Participation is confirmed. No individual tasks have been scheduled yet.'}</p>}</div>
   </article>;
  })}</div>:<p className="text-sm text-earth-mid py-3">{kind==='family'?'No family assigned.':'No projects assigned yet.'}</p>}
 </section>;
}

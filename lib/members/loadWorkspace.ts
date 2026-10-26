import {memberService,dbResult,type requireMember} from './auth';
import {canEditRoster} from './roster';
import type {Term} from '@/lib/term/schema';

// One authenticated, parallel read. Nothing is cached between members or requests.
export async function loadMemberWorkspace({client,account}:Awaited<ReturnType<typeof requireMember>>){
 const db=memberService();
 const rosterQuery=db.from('member_accounts').select('person_id,name,group_id').in('state',['active','invited']);
 const [profileResult,rosterResult,projections,masterResult,plansResult]=await Promise.all([
 db.from('team_members').select('data').eq('id',account.person_id).maybeSingle(),rosterQuery,
 Promise.all(['member_tasks','member_reflections','member_groups','member_projects','member_events'].map(t=>client.from(t).select('data'))),
 db.from('term_workspaces').select('document').eq('id','2026-27-T1').maybeSingle(),
 client.from('member_personal_plans').select('data,user_id').order('updated_at',{ascending:false}).limit(300),
 ]);
 const [tasks,reflections,groups,projects,events]=projections;
 const profile=dbResult(profileResult);
 const position=profile?.data?.role==='lead'?'Leader':profile?.data?.role==='coordinator'?'Core team':'Member';
 const master=dbResult(masterResult)?.document as Term|undefined;
 const scopes=(master?.scopes??[]).filter(scope=>account.role==='admin'||scope.memberIds.includes(account.person_id)||scope.coordinatorIds.includes(account.person_id));
 const responsibilities=(master?.responsibilities??[]).filter(role=>account.role==='admin'||role.memberIds.includes(account.person_id));
 const taskRows=(dbResult(tasks)??[]).map(row=>row.data);
 const visiblePeople=new Set([account.person_id,...taskRows.flatMap(task=>[task.ownerId,...(task.collaboratorIds??[])]),...scopes.flatMap(scope=>[...scope.memberIds,...scope.coordinatorIds])]);
 const projectIds=new Set([...scopes.map(scope=>scope.id),...taskRows.map(task=>task.projectId)]);
 const projectRows=(dbResult(projects)??[]).map(row=>row.data).filter(project=>account.role==='admin'||!master?.planVersion||projectIds.has(project.id));
 const roster=(dbResult(rosterResult)??[]).filter(person=>account.role==='admin'||visiblePeople.has(person.person_id)||(account.group_id!==null&&person.group_id===account.group_id));
 return {personalPlans:plansResult.error?null:(plansResult.data??[]).map(row=>row.data),personalPlansError:plansResult.error?'Your personal plans could not be loaded. Please retry.':'',me:{name:account.name,role:account.role,position,personId:account.person_id,groupId:account.group_id,canEditRoster:canEditRoster(account)},tasks:taskRows,scopes,responsibilities,reflections:(dbResult(reflections)??[]).map(x=>x.data),groups:(dbResult(groups)??[]).map(x=>x.data),projects:projectRows,events:(dbResult(events)??[]).map(x=>x.data),roster};
}

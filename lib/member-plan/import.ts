import { termSchema, type Term } from '@/lib/term/schema';
import type { MemberPlan } from './schema';
import { previewMemberPlan, type DirectoryPerson, type PlanAccount } from './preview';

/** Deterministic extension of the existing canonical document; never resets imported progress. */
export function importMemberPlan(plan:MemberPlan,current:Term,revision:number,directory:DirectoryPerson[],accounts:PlanAccount[],now:string){
  const preview=previewMemberPlan(plan,directory,accounts,{revision,document:current});
  if(current.tasks.some(task=>task.sourcePlan===plan.id))return {document:termSchema.parse(current),preview};
  const next=structuredClone(current);
  next.planVersion=1;
  const bindings=new Map(preview.bindings.map(binding=>[binding.key,binding]));
  const people=new Set(next.people.map(person=>person.id));
  const personIds=(keys:string[])=>keys.flatMap(key=>{const binding=bindings.get(key);return binding?.personId&&people.has(binding.personId)&&binding.state!=='inactive'&&binding.state!=='pending-link'?[binding.personId]:[];});
  const assignable=(keys:string[])=>keys.flatMap(key=>{const binding=bindings.get(key);return binding?.state==='linked'&&binding.personId&&people.has(binding.personId)?[binding.personId]:[];});
  const scopes=plan.scopes.map(scope=>({id:scope.id,title:scope.title,kind:scope.kind,memberIds:personIds(scope.memberKeys),coordinatorIds:personIds(scope.coordinatorKeys),note:scope.note,sourcePlan:plan.id}));
  next.scopes=[...(next.scopes??[]).filter(scope=>scope.sourcePlan!==plan.id),...scopes];
  next.responsibilities=[...(next.responsibilities??[]).filter(role=>role.sourcePlan!==plan.id),...plan.responsibilities.map(role=>({id:`${plan.id}:role:${role.id}`,scopeId:role.scopeId,memberIds:personIds(role.memberKeys),description:role.description,confirmation:role.confirmation,sourcePlan:plan.id}))];
  next.tutoringSeries=[...(next.tutoringSeries??[]).filter(series=>series.sourcePlan!==plan.id),...plan.series.map(series=>({id:`${plan.id}:series:${series.id}`,scopeId:series.scopeId,title:series.title,memberIds:personIds(series.memberKeys),frequency:series.frequency,firstDate:null,startTime:null,locationRule:series.locationRule,anchorConfirmed:false,sourcePlan:plan.id}))];
  for(const task of preview.tasks){
    if(next.tasks.some(existing=>existing.id===task.stableId))continue;
    const owners=assignable(task.ownerKeys),pending=personIds(task.ownerKeys).filter(id=>!owners.includes(id));
    const scope=plan.scopes.find(scope=>scope.id===task.scopeId)!;
    const instant=task.deadline.kind==='time'?new Date(task.deadline.at).toISOString():null;
    const due=task.deadline.kind==='date'?task.deadline.date:instant?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(instant)):null;
    next.tasks.push({id:task.stableId,schoolYear:plan.schoolYear,sourcePlan:plan.id,sourceId:task.id,title:task.title,ownerId:owners[0]??null,collaboratorIds:owners.slice(1),pendingAssigneeIds:pending,groupId:null,projectId:scope.legacyProjectId,eventId:null,scopeId:scope.id,due,dueAt:instant,priority:task.id==='P02'?'High':'Normal',status:'Not started',update:'',nextStep:task.deliverable,evidence:'',deliverable:task.deliverable,timingNote:task.timingNote,recurrence:task.recurrence,dependsOn:task.dependsOn.map(id=>`${plan.id}:task:${id}`),contributions:{},updatedAt:now});
  }
  for(const scope of plan.scopes){const project=next.projects.find(project=>project.id===scope.legacyProjectId);if(project)project.participantIds=personIds([...new Set([...scope.memberKeys,...scope.coordinatorKeys])]);}
  for(const correction of preview.corrections){if(!correction.applicable)continue;const rows=next[correction.section] as unknown as Record<string,unknown>[];const index=rows.findIndex(row=>row.id===correction.recordId);if(index>=0)rows[index]={...rows[index],...correction.fields};}
  return {document:termSchema.parse(next),preview};
}

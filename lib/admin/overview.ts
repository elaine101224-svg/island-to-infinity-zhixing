import type {Term} from '@/lib/term/schema';
const dateInChina=(date:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export function adminOverview(document:Term,now:Date){
 const today=dateInChina(now),until=dateInChina(new Date(new Date(today+'T12:00:00+08:00').getTime()+6*86400000));
 const assigned=document.tasks.filter(task=>task.sourcePlan||task.ownerId||task.collaboratorIds?.length);
 const active=assigned.filter(task=>!['Completed','Cancelled'].includes(task.status));
 const overdue=(task:Term['tasks'][number])=>task.dueAt?new Date(task.dueAt).getTime()<now.getTime():!!task.due&&task.due<today;
 return {today,until,assigned,active,
  deadlines:active.filter(task=>task.due&&(overdue(task)||task.due<=until)).toSorted((a,b)=>a.due!.localeCompare(b.due!)||(a.dueAt??'').localeCompare(b.dueAt??'')),
  overdue:active.filter(overdue),blocked:active.filter(task=>task.status==='Blocked'),
  pendingLinks:active.filter(task=>task.pendingAssigneeIds?.length),
  unconfirmed:document.events.filter(event=>event.date>=today&&['Tentative','Proposed','Awaiting approval'].includes(event.status)),
  events:document.events.filter(event=>event.status==='Confirmed'&&event.date<=until&&(event.endDate??event.date)>=today).toSorted((a,b)=>a.date.localeCompare(b.date)),
  scopes:(document.scopes??[]).map(scope=>({...scope,tasks:active.filter(task=>task.scopeId===scope.id||(!task.scopeId&&task.projectId===scope.id))})),
 };
}

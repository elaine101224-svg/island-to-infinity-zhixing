import {taskProgress,type MemberTask,type Workspace} from './workspace';

export type TaskFocus='all'|'week'|'overdue'|'blocked';
export function taskOverdue(task:MemberTask,now:Date=new Date()){
 return task.dueAt?new Date(task.dueAt).getTime()<now.getTime():!!task.due&&task.due<chinaTodayAt(now);
}
function chinaTodayAt(now:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function memberTaskList(workspace:Workspace,{done=false,query='',scopeId='',focus='all',now=new Date()}:{done?:boolean;query?:string;scopeId?:string;focus?:TaskFocus;now?:Date}={}){
 const today=chinaTodayAt(now),until=chinaTodayAt(new Date(now.getTime()+7*86400000));
 const search=query.trim().toLowerCase();
 return workspace.tasks.filter(task=>{
  const status=taskProgress(task,workspace.me.personId),closed=['Completed','Cancelled'].includes(status);
  const scope=workspace.scopes.find(scope=>scope.id===(task.scopeId??task.projectId));
  return done===closed&&(!scopeId||(task.scopeId??task.projectId)===scopeId)&&(!search||[task.title,task.deliverable,task.nextStep,scope?.title].join(' ').toLowerCase().includes(search))&&(focus==='all'||(focus==='overdue'?taskOverdue(task,now):focus==='blocked'?status==='Blocked':!!task.due&&!taskOverdue(task,now)&&task.due>=today&&task.due<=until));
 }).toSorted((a,b)=>deadline(a)-deadline(b)||Number(b.priority==='High')-Number(a.priority==='High')||a.title.localeCompare(b.title));
}

function deadline(task:MemberTask){return task.dueAt?Date.parse(task.dueAt):task.due?Date.parse(task.due+'T23:59:59.999+08:00'):Infinity;}

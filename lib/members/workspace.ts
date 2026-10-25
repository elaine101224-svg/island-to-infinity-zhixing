import type {Term} from '@/lib/term/schema';
export type MemberView='tasks'|'calendar'|'projects';
export type Workspace={me:{name:string;position:string;role:'admin'|'coordinator'|'member';personId:string;groupId:string|null;canEditRoster:boolean};tasks:Term['tasks'];reflections:Term['reflections'];groups:Term['groups'];projects:Term['projects'];events:Term['events'];scopes:NonNullable<Term['scopes']>;responsibilities:NonNullable<Term['responsibilities']>;roster:{person_id:string;name:string;group_id:string|null}[]};
export type MemberTask=Term['tasks'][number];
export const taskIsShared=(task:MemberTask)=>Boolean(task.collaboratorIds?.length);
export const taskProgress=(task:MemberTask,personId:string)=>['Completed','Cancelled'].includes(task.status)?task.status:taskIsShared(task)?task.contributions?.[personId]?.status??'Awaiting confirmation':task.status;
export const statusLabel=(status:string)=>({'Awaiting confirmation':'To confirm','Not started':'To do','In progress':'In progress',Blocked:'Needs help',Completed:'Done',Cancelled:'Cancelled'}[status]??status);
export const chinaToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function deadlineLabel(task:MemberTask){if(task.dueAt)return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(task.dueAt));if(task.due)return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'short'}).format(new Date(task.due+'T12:00:00Z'));return task.recurrence==='weekly-unanchored'?'Weekly · date to confirm':'No deadline';}

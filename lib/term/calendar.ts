import type {Term} from './schema';
export type CalendarView='month'|'week'|'list';
export type CalendarScope='all'|'events'|'tasks';
type Common={key:string;title:string;date:string|null;endDate:string|null;status:string};
export type CalendarEntry=(Common&{kind:'event';source:Term['events'][number]})|(Common&{kind:'task';source:Term['tasks'][number]});
export const dateObject=(date:string)=>new Date(date+'T12:00:00Z');
export const isoDate=(date:Date)=>date.toISOString().slice(0,10);
export const addDays=(date:string,count:number)=>{const value=dateObject(date);value.setUTCDate(value.getUTCDate()+count);return isoDate(value);};
export const monthStart=(date:string)=>date.slice(0,7)+'-01';
export const monthEnd=(date:string)=>{const value=dateObject(monthStart(date));value.setUTCMonth(value.getUTCMonth()+1);value.setUTCDate(0);return isoDate(value);};
export function addMonths(date:string,count:number){const value=dateObject(monthStart(date));value.setUTCMonth(value.getUTCMonth()+count);const day=Math.min(dateObject(date).getUTCDate(),dateObject(monthEnd(isoDate(value))).getUTCDate());value.setUTCDate(day);return isoDate(value);}
export const weekStart=(date:string)=>addDays(date,-((dateObject(date).getUTCDay()+6)%7));
export function monthCells(date:string){const first=monthStart(date),start=weekStart(first),last=monthEnd(date);const length=Math.ceil(((dateObject(last).getTime()-dateObject(start).getTime())/86400000+1)/7)*7;return Array.from({length},(_,index)=>addDays(start,index));}
export const weekCells=(date:string)=>Array.from({length:7},(_,index)=>addDays(weekStart(date),index));
export function period(date:string,view:CalendarView){return view==='week'?{start:weekStart(date),end:addDays(weekStart(date),6)}:{start:monthStart(date),end:monthEnd(date)};}
export function calendarEntries(events:Term['events'],tasks:Term['tasks'],scope:CalendarScope='all'):CalendarEntry[]{return [...(scope==='tasks'?[]:events.map(source=>({kind:'event' as const,key:'event-'+source.id,title:source.title,date:source.date,endDate:source.endDate??source.date,status:source.status,source}))),...(scope==='events'?[]:tasks.map(source=>({kind:'task' as const,key:'task-'+source.id,title:source.title,date:source.due,endDate:source.due,status:source.status,source})))];}
export function onDate(entries:CalendarEntry[],date:string){return entries.filter(entry=>entry.date&&entry.date<=date&&(entry.endDate??entry.date)>=date).sort((a,b)=>{const ta=a.kind==='event'?a.source.startTime??'': '';const tb=b.kind==='event'?b.source.startTime??'':'';return ta.localeCompare(tb)||a.title.localeCompare(b.title);});}
export function inPeriod(entries:CalendarEntry[],start:string,end:string){return entries.filter(entry=>entry.date&&entry.date<=end&&(entry.endDate??entry.date)>=start);}
export const timed=(entry:CalendarEntry)=>entry.kind==='event'&&!!entry.source.startTime&&entry.date===entry.endDate;
const minute=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3,5));
export function timeLayout(entries:CalendarEntry[]){const rows=entries.filter(timed).map(entry=>{const source=(entry as Extract<CalendarEntry,{kind:'event'}>).source;const start=minute(source.startTime!);return{entry,start,end:source.endTime?minute(source.endTime):start+44,lane:0,lanes:1};}).sort((a,b)=>a.start-b.start);let group:typeof rows=[];let groupEnd=-1;const result:typeof rows=[];function flush(){const ends:number[]=[];for(const row of group){let lane=ends.findIndex(end=>end<=row.start);if(lane<0)lane=ends.length;ends[lane]=Math.max(row.end,row.start+24);row.lane=lane;}for(const row of group)row.lanes=ends.length;result.push(...group);group=[];}for(const row of rows){if(group.length&&row.start>=groupEnd){flush();groupEnd=-1;}group.push(row);groupEnd=Math.max(groupEnd,row.end,row.start+24);}flush();return result;}

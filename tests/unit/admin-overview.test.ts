import {it,expect} from 'vitest';
import {adminOverview} from '@/lib/admin/overview';
import {createTermSeed} from '@/lib/term/seed';
import type {Term} from '@/lib/term/schema';
const now=new Date('2026-10-26T09:00:00.000Z');
const base:Term['tasks'][number]={id:'one',title:'Dummy task',ownerId:'a',groupId:null,projectId:null,eventId:null,scopeId:'project',due:null,status:'Awaiting confirmation',priority:'Normal',update:'',nextStep:'',evidence:'',updatedAt:'2026-10-26T00:00:00.000Z'};
it('uses China dates and exact-time deadlines without marking date-only work overdue during that day',()=>{
 const doc=createTermSeed();doc.tasks=[{...base,id:'date-only',due:'2026-10-26'},{...base,id:'precise',due:'2026-10-26',dueAt:'2026-10-26T08:00:00.000Z'},{...base,id:'outside-week',due:'2026-11-02'},{...base,id:'cancelled',due:'2026-10-25',status:'Cancelled'},{...base,id:'done',due:'2026-10-25',status:'Completed',evidence:'Finished'}];
 const model=adminOverview(doc,now);expect(model.today).toBe('2026-10-26');expect(model.until).toBe('2026-11-01');expect(model.overdue.map(task=>task.id)).toEqual(['precise']);expect(model.deadlines.map(task=>task.id).sort()).toEqual(['date-only','precise']);
 expect(adminOverview(doc,new Date('2026-10-26T16:01:00Z')).today).toBe('2026-10-27');
});
it('counts a shared assignment once and keeps project membership visible without individual tasks',()=>{
 const doc=createTermSeed();doc.tasks=[{...base,collaboratorIds:['b']},{...base,id:'legacy',ownerId:null,scopeId:undefined}];doc.scopes=[{id:'project',title:'Dummy project',kind:'project',memberIds:['a','b'],coordinatorIds:[],note:'',sourcePlan:'test'},{id:'empty-project',title:'Assigned project',kind:'project',memberIds:['c'],coordinatorIds:[],note:'',sourcePlan:'test'}];const prior=structuredClone(doc),model=adminOverview(doc,now);expect(model.assigned).toHaveLength(1);expect(model.scopes[0].tasks).toHaveLength(1);expect(model.scopes[1].memberIds).toEqual(['c']);expect(model.scopes[1].tasks).toEqual([]);expect(doc).toEqual(prior);
});
it('shows only confirmed activities in this week, keeping tentative dates in planning',()=>{
 const doc=createTermSeed(),event={id:'confirmed',title:'Dummy',date:'2026-10-27',endDate:null,startTime:null,endTime:null,location:'',status:'Confirmed',evidence:'Host confirmed',notes:'',schoolEvent:false,participation:'TBC',participationEvidence:''} as const;doc.tasks=[];doc.events=[event,{...event,id:'tentative',status:'Tentative',evidence:''},{...event,id:'cancelled',status:'Cancelled'},{...event,id:'overlapping',date:'2026-10-25',endDate:'2026-10-27'}];const model=adminOverview(doc,now);expect(model.events.map(event=>event.id)).toEqual(['overlapping','confirmed']);expect(model.unconfirmed.map(event=>event.id)).toEqual(['tentative']);
});

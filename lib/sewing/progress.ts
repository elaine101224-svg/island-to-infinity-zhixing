import {workflow,type OrderTimelineData,type StageId} from './timeline';
export type ProgressUpdate={id:string;stage:StageId;state:'doing'|'done';note:string;occurredOn:string|null;at:string;files:{id:string;name:string;mime:string}[]};
export function progressTimeline(base:OrderTimelineData,updates:ProgressUpdate[],delivered:boolean):OrderTimelineData{
 if(!updates.length)return base;
 const stages=base.stages.map(s=>({...s}));
 const latest=updates.at(-1)!;
 for(const update of updates){const stage=stages.find(s=>s.id===update.stage);if(!stage)continue;stage.state=update.state==='done'?'recorded':'pending';stage.detail=update.note||'团队已更新此阶段';stage.date=update.occurredOn;}
 const current=latest.state==='doing'?latest.stage:workflow.slice(workflow.findIndex(s=>s.id===latest.stage)+1).find(s=>!['done','recorded'].includes(stages.find(x=>x.id===s.id)!.state))?.id;
 for(const stage of stages){if(stage.state==='current')stage.state='pending';if(stage.id===current)stage.state='current';}
 return {stages,current:delivered?'已交付':stages.find(s=>s.state==='current')?.title||'阶段已更新',completed:stages.filter(s=>s.state==='done'||s.state==='recorded').length,total:stages.length,updatedAt:latest.at};
}

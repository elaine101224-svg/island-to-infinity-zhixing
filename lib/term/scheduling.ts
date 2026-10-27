import type {Term} from './schema';
type Event=Term['events'][number];
export function activityTimeLabel(event:Event){return event.startTime?`${event.startTime}${event.endTime?'–'+event.endTime:' · End TBD'}`:event.windowStartTime&&event.windowEndTime?`Within ${event.windowStartTime}–${event.windowEndTime} · exact slot TBD`:'Time TBD';}
export function scheduleConflicts(events:Event[]){
 const conflicts:{eventIds:string[];memberIds:string[];potential:boolean}[]=[];
 const active=events.filter(e=>!e.archived&&e.startTime&&e.endTime);
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j];if(a.date!==b.date||a.startTime!>=b.endTime!||b.startTime!>=a.endTime!||a.parentEventId===b.id||b.parentEventId===a.id)continue;
  const excluded=new Set([...(a.excludedParticipantIds??[]),...(b.excludedParticipantIds??[])]);
  const confirmed=(a.participantIds??[]).filter(id=>b.participantIds?.includes(id)&&!excluded.has(id));
  if(confirmed.length)conflicts.push({eventIds:[a.id,b.id],memberIds:confirmed,potential:false});
  const potential=[...new Set([...(a.participantIds??[]),...(a.invitedMemberIds??[]),...(a.candidateMemberIds??[])])].filter(id=>[...(b.participantIds??[]),...(b.invitedMemberIds??[]),...(b.candidateMemberIds??[])].includes(id)&&!confirmed.includes(id)&&!excluded.has(id));
  if(potential.length)conflicts.push({eventIds:[a.id,b.id],memberIds:potential,potential:true});
 }
 return conflicts;
}

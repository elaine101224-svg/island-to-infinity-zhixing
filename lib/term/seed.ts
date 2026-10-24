import { type Term, groupRoles } from './schema';
const event = (id: string, title: string, date: string, status: Term['events'][number]['status'], notes: string, endDate: string | null = null, timed = false, schoolEvent = false): Term['events'][number] => ({id,title,date,endDate,startTime:timed?'19:00':null,endTime:timed?'20:00':null,location:id==='training'?'R1325':'TBC',status,evidence:schoolEvent?'School event date listed in Term 1 brief (2026-10-23); participation not verified.':'',notes,schoolEvent,participation:'TBC',participationEvidence:''});
const project = (id: string,title: string,owners: string,interestSnapshot: string,start: string,end: string,status: Term['projects'][number]['status'],description: string,nextAction: string,milestones=''): Term['projects'][number] => ({id,title,owners,interestSnapshot,start,end,status,description,nextAction,milestones,interestedIds:[],participantIds:[],privacy:'Internal planning',evidence:''});
export function createTermSeed(): Term {
 return {term:'2026-27-T1', people:[], reflections:[],recaps:[],
 groups: (['A','B','C','D'] as const).map(id=>({id,coordinator:'TBC',plan:'Agree a non-sensitive group plan and confirm responsibilities.',assignments:groupRoles.map(role=>({role,memberIds:[]}))})),
 events:[
 event('reflection-oct','Group reflection, planning and role allocation','2026-10-22','Proposed','Scheduled in master plan; date passed, completion and attendance not verified.',null,true),
 event('training','Volunteer Tutor Training','2026-10-29','Proposed','Conflict: master plan proposes training; older worksheet says no session. Admin decision needed.',null,true),
 event('campus','Private campus activity proposal','2026-10-31','Awaiting approval','Family consent and coordinator approval required. No identifying details.'),
 event('split-visit','Potential split group visit','2026-11-05','Tentative','Group and caregiver arrangements TBC.'),
 event('study','Study Habits Workshop','2026-11-07','Proposed','Backup: 21 November. Time and location TBC.'),
 event('study-backup','Study Habits Workshop backup window','2026-11-21','Available slot','Alternative to 7 November, not a second workshop.'),
 event('reflection-nov','Monthly Reflection Session','2026-11-19','Proposed','Older plans suggest visits on this date; resolve conflict before booking.',null,true),
 event('nov-window','Family activity / library visit window','2026-11-26','Available slot','Available window only; nothing booked.','2026-11-29'),
 event('reflection-dec','Monthly Reflection / Term 2 consideration','2026-12-03','Proposed','Planned, not verified confirmed or completed.',null,true),
 event('dec-window','Family visit window','2026-12-05','Available slot','Activities and participants TBC.','2026-12-06'),
 event('wrap-window','Family activity / term wrap-up window','2026-12-10','Available slot','Participation TBC.','2026-12-12'),
 event('market','Winter Charity Market (school event)','2026-12-11','Confirmed','School event exists; our booth and roles are TBC.',null,false,true),
 event('winterfest','Winterfest (school event)','2026-12-12','Confirmed','School event exists; group involvement TBC.',null,false,true),
 ],
 projects:[
 project('library','Changshu Library','TBC','','Nov 2026','Ongoing','Not Started','Explore library collaboration across groups.','Contact library and confirm feasibility.'),
 project('booth','Photo Booth Fundraiser','TBC','','Oct 2026','TBD','Not Started','Shared fundraiser planning.','Confirm approval and milestone participation.','7 Nov and 11 Dec: potential milestones, not formal deadlines.'),
 project('market','Winter Charity Market','TBC','','Nov 2026','Dec 2026','Not Started','Plan a possible Island to Infinity booth.','Confirm booth approval and responsibilities.'),
 project('institute','Welfare Institute Project','TBC','','TBD','Ongoing / TBD','Awaiting Response','Exploratory collaboration; participants include adults with disabilities.','Await response; no visits before institutional approval.'),
 project('bullying','Anti-Bullying Workshop','TBC','','Nov 2026','Nov 2026 (tentative)','Planning','Develop a consent-aware workshop.','Review scope and obtain approval.'),
 project('education','Puberty and Sex Education Workshop','TBC','','Nov 2026','TBD','Not Started','Plan age-appropriate education with supervisor review; no personal health information here.','Agree safeguarding, consent and facilitator requirements.'),
 project('training','Volunteer Tutor Training','TBC','','Proposed 29 Oct 2026','TBD','Planning','Prepare volunteers for tutoring.','Resolve 29 October conflict.'),
 project('study','Study Habits Workshop','TBC','','Proposed 7 Nov 2026','TBD','Planning','Shared learning workshop; 21 November backup.','Confirm date, time, venue and facilitators.'),
 project('sewing','Sewing Team Outreach','TBC','','Ongoing','Ongoing','Planning','Fair paid production, quotations, order terms and payment follow-up.','Coordinate outreach using the existing sewing workflow.'),
 ],tasks: (['A','B','C','D'] as const).map(groupId=>({id:`roles-${groupId}`,title:`Allocate Family Group ${groupId} responsibilities`,ownerId:null,groupId,projectId:null,eventId:'reflection-oct',due:null,priority:'High' as const,status:'Not started' as const,update:'No assignees inferred from blank worksheets.',nextStep:'Assign 1–2 people each to Communication, Academic and Documentation.',evidence:'',updatedAt:'2026-10-23T00:00:00.000Z'}))};
}

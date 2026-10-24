import { z } from 'zod';
export const eventStatuses = ['Confirmed', 'Proposed', 'Tentative', 'Available slot', 'Awaiting approval', 'Completed', 'Cancelled'] as const;
export const taskStatuses = ['Not started', 'In progress', 'Blocked', 'Completed'] as const;
export const groupIds = ['A', 'B', 'C', 'D'] as const;
export const groupRoles = ['Communication', 'Academic', 'Documentation', 'Follow-up', 'Outreach'] as const;
const text = z.string().trim().max(2000);
const id = z.string().min(1).max(100);
const date = z.iso.date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const group = z.enum(groupIds);
export const termSchema = z.object({
  term: z.literal('2026-27-T1'),
  events: z.array(z.object({ id, title: z.string().trim().min(1).max(200), date, endDate: date.nullable(), startTime: time.nullable(), endTime: time.nullable(), location: text, status: z.enum(eventStatuses), evidence: text, notes: text, schoolEvent: z.boolean(), participation: z.enum(['TBC', 'Confirmed', 'Not participating']), participationEvidence: text })).max(200),
  groups: z.array(z.object({ id: group, coordinator: text, plan: text, assignments: z.array(z.object({ role: z.enum(groupRoles), memberIds: z.array(id).max(2) })).max(5) })).length(4),
  people: z.array(z.object({ id, name: z.string().trim().min(1).max(100), groupId: group.nullable(), availability: text })).max(100),
  projects: z.array(z.object({ id, title: z.string().trim().min(1).max(200), description: text, owners: text, interestSnapshot: text, interestedIds: z.array(id).max(100), participantIds: z.array(id).max(100), start: text, end: text, milestones: text, status: z.enum(['Not Started', 'Planning', 'Awaiting Response', 'In progress', 'Completed', 'On hold']), evidence: text, nextAction: text, privacy: z.literal('Internal planning') })).max(100),
  tasks: z.array(z.object({ id, title: z.string().trim().min(1).max(200), ownerId: id.nullable(), groupId: group.nullable(), projectId: id.nullable(), eventId: id.nullable(), due: date.nullable(), priority: z.enum(['Normal', 'High']), status: z.enum(taskStatuses), update: text, nextStep: text, evidence: text, updatedAt: z.iso.datetime() })).max(500),
  reflections: z.array(z.object({ id, memberId: id, groupId: group, date, summary: text.min(1), review: z.enum(['Pending', 'Reviewed']) })).max(500),
  recaps: z.array(z.object({ id, groupId: group, month: z.string().regex(/^2026-(10|11|12)$/), completed: text, ongoing: text, obstacles: text, nextAction: text, ownerId: id.nullable(), review: z.enum(['Pending', 'Reviewed']) })).max(100),
}).strict().superRefine((doc, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const people = new Set(doc.people.map(p => p.id));
  const projects = new Set(doc.projects.map(p => p.id));
  const events = new Set(doc.events.map(e => e.id));
  for (const list of [doc.events, doc.groups, doc.people, doc.projects, doc.tasks, doc.reflections, doc.recaps]) if (new Set(list.map(x => x.id)).size !== list.length) fail('Duplicate record IDs');
  for (const e of doc.events) {
    if (['Confirmed','Completed'].includes(e.status) && !e.evidence.trim()) fail('Confirmed/completed events require evidence');
    if (e.participation === 'Confirmed' && !e.participationEvidence.trim()) fail('Participation requires separate evidence');
    if (e.endDate && e.endDate < e.date) fail('Event end precedes start');
    if (e.endTime && !e.startTime) fail('End time requires start time');
    if ((!e.endDate || e.endDate === e.date) && e.startTime && e.endTime && e.endTime <= e.startTime) fail('End time must follow start');
  }
  for (const g of doc.groups) {
    if (new Set(g.assignments.map(a => a.role)).size !== g.assignments.length) fail('Duplicate group role');
    for (const a of g.assignments) for (const member of a.memberIds) if (!doc.people.some(p => p.id === member && p.groupId === g.id)) fail('Roles must belong to the same group');
  }
  for (const p of doc.projects) {
    for (const member of [...p.interestedIds,...p.participantIds]) if (!people.has(member)) fail('Unknown project member');
    if (p.status === 'Completed' && !p.evidence.trim()) fail('Completed project requires evidence');
  }
  for (const t of doc.tasks) {
    if (t.ownerId && !people.has(t.ownerId)) fail('Unknown task owner');
    if (t.groupId && t.ownerId && !doc.people.some(p => p.id === t.ownerId && p.groupId === t.groupId)) fail('Task owner belongs to another group');
    if (t.projectId && !projects.has(t.projectId)) fail('Unknown project');
    if (t.eventId && !events.has(t.eventId)) fail('Unknown event');
    if (t.status === 'Completed' && !t.evidence.trim()) fail('Completed task requires evidence');
  }
  for (const r of doc.reflections) if (!doc.people.some(p => p.id === r.memberId && p.groupId === r.groupId)) fail('Reflection member belongs to another group');
  for (const r of doc.recaps) if (r.ownerId && !doc.people.some(p => p.id === r.ownerId && p.groupId === r.groupId)) fail('Recap owner belongs to another group');
});
export type Term = z.infer<typeof termSchema>;
export const saveTermSchema = z.object({ revision: z.number().int().nonnegative(), document: termSchema }).strict();

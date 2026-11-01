import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const text = z.string().trim().min(1).max(4000);
export const deadlineSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('unscheduled'), note: text }).strict(),
  z.object({ kind: z.literal('date'), date: z.iso.date(), confirmed: z.literal(true) }).strict(),
  z.object({ kind: z.literal('time'), at: z.iso.datetime({ offset: true }), confirmed: z.literal(true) }).strict(),
]);
/** An import proposal, never a login/authorization source. Names carry no privileges. */
export const memberPlanSchema = z.object({
  id, version: z.literal(1), schoolYear: z.string().regex(/^20\d{2}–\d{2}$/),
  updatedOn: z.iso.date(), timezone: z.literal('Asia/Shanghai'),
  members: z.array(z.object({
    key: id, label: text, personId: id.nullable(), expectedDirectoryName: text.nullable(),
    state: z.enum(['participating', 'inactive']), bindingEvidence: text,
  }).strict()).max(100),
  scopes: z.array(z.object({
    id, title: text, kind: z.enum(['family', 'project']),
    legacyProjectId: id.nullable(), memberKeys: z.array(id).max(100),
    coordinatorKeys: z.array(id).max(10), note: text,
  }).strict()).max(100),
  responsibilities: z.array(z.object({
    id, scopeId: id, memberKeys: z.array(id).min(1).max(100),
    description: text, confirmation: z.literal('confirmed'),
  }).strict()).max(200),
  tasks: z.array(z.object({
    id, scopeId: id, ownerKeys: z.array(id).min(1).max(100), title: text,
    deliverable: text, timingNote: text, deadline: deadlineSchema,
    status: z.literal('待确认'), dependsOn: z.array(id).max(20),
    recurrence: z.enum(['none', 'weekly-unanchored', 'to-confirm']),
    basis: z.literal('suggested-action'),
  }).strict()).max(500),
  series: z.array(z.object({
    id, scopeId: id, title: text, memberKeys: z.array(id).min(1).max(100),
    frequency: z.literal('weekly'), firstDate: z.null(), startTime: z.null(),
    locationRule: text, anchorConfirmed: z.literal(false),
  }).strict()).max(100),
  corrections: z.array(z.object({
    id, section: z.enum(['events', 'projects']), recordId: id,
    fields: z.record(z.string(), z.unknown()), reason: text,
  }).strict()).max(100),
  gaps: z.array(text).max(100),
}).strict().superRefine((plan, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  for (const rows of [plan.members, plan.scopes, plan.responsibilities, plan.tasks, plan.series, plan.corrections]) {
    const keys = rows.map(row => 'key' in row ? row.key : row.id);
    if (new Set(keys).size !== keys.length) fail('Duplicate source IDs');
  }
  const members = new Map(plan.members.map(member => [member.key, member]));
  const scopes = new Map(plan.scopes.map(scope => [scope.id, scope]));
  const tasks = new Map(plan.tasks.map(task => [task.id, task]));
  const bound = plan.members.flatMap(member => member.personId ? [member.personId] : []);
  if (new Set(bound).size !== bound.length) fail('Two labels cannot bind the same person');
  const checkMembers = (keys: string[]) => {
    if (new Set(keys).size !== keys.length) fail('Duplicate participants');
    for (const key of keys) if (members.get(key)?.state !== 'participating') fail('Unknown or inactive participant');
  };
  for (const member of plan.members) {
    if (Boolean(member.personId) !== Boolean(member.expectedDirectoryName)) fail('Binding requires both an ID and expected directory name');
  }
  for (const scope of plan.scopes) { checkMembers(scope.memberKeys); checkMembers(scope.coordinatorKeys); }
  for (const row of [...plan.responsibilities, ...plan.tasks, ...plan.series]) {
    const scope = scopes.get(row.scopeId);
    if (!scope) fail('Unknown scope');
    const keys = 'ownerKeys' in row ? row.ownerKeys : row.memberKeys;
    checkMembers(keys);
    for (const key of keys) if (scope && ![...scope.memberKeys, ...scope.coordinatorKeys].includes(key)) fail('Participant is outside scope');
  }
  for (const task of plan.tasks) {
    for (const parent of task.dependsOn) if (!tasks.has(parent) || parent === task.id) fail('Invalid dependency');
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (key: string) => {
    if (visiting.has(key)) { fail('Cyclic dependency'); return; }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const parent of tasks.get(key)?.dependsOn ?? []) visit(parent);
    visiting.delete(key); visited.add(key);
  };
  for (const key of tasks.keys()) visit(key);
});
export type MemberPlan = z.infer<typeof memberPlanSchema>;

import { describe, it, expect } from 'vitest';
import { memberPlanSchema, type MemberPlan } from '@/lib/member-plan/schema';
import { previewMemberPlan, type PlanAccount } from '@/lib/member-plan/preview';
import { importMemberPlan } from '@/lib/member-plan/import';
import { createTermSeed } from '@/lib/term/seed';

function plan(): MemberPlan {
  return { id: 'dummy-plan', version: 1, schoolYear: '2026–27', updatedOn: '2026-10-25', timezone: 'Asia/Shanghai',
    members: [{ key: 'a', label: 'Alex', personId: 'directory-a', expectedDirectoryName: 'Alex Dummy', state: 'participating', bindingEvidence: 'Reviewed ID' }, { key: 'b', label: 'Bailey', personId: 'directory-b', expectedDirectoryName: 'Bailey Dummy', state: 'participating', bindingEvidence: 'Reviewed ID' }, { key: 'left', label: 'Former member', personId: null, expectedDirectoryName: null, state: 'inactive', bindingEvidence: 'Left' }],
    scopes: [{ id: 'booth', title: 'Dummy Booth', kind: 'project', legacyProjectId: 'booth', memberKeys: ['a', 'b'], coordinatorKeys: [], note: 'Pending details' }],
    responsibilities: [{ id: 'r', scopeId: 'booth', memberKeys: ['a', 'b'], description: 'Coordinate booth', confirmation: 'confirmed' }],
    tasks: [{ id: 'P02', scopeId: 'booth', ownerKeys: ['a', 'b'], title: 'Purchase list', deliverable: 'Items, quantity, cost', timingNote: 'Reviewed deadline', deadline: { kind: 'time', at: '2026-11-01T23:59:00+08:00', confirmed: true }, status: '待确认', dependsOn: [], recurrence: 'none', basis: 'suggested-action' }],
    series: [{ id: 'weekly', scopeId: 'booth', title: 'Dummy weekly', memberKeys: ['a'], frequency: 'weekly', firstDate: null, startTime: null, locationRule: 'Await anchor', anchorConfirmed: false }],
    corrections: [{ id: 'c', section: 'events', recordId: 'market', fields: { status: 'Tentative' }, reason: 'Date unconfirmed' }], gaps: ['First date pending'] };
}
const directory = [{ id: 'directory-a', data: { name: 'Alex Dummy' } }, { id: 'directory-b', data: { name: 'Bailey Dummy' } }];
const accounts: PlanAccount[] = [{ user_id: 'account-a', person_id: 'directory-a', name: 'Alex Dummy', state: 'active', role: 'member' }, { user_id: 'account-b', person_id: 'directory-b', name: 'Bailey Dummy', state: 'invited', role: 'member' }];
describe('member plan dry-run import', () => {
  it('imports canonical shared work once and preserves subsequent progress on repeat import',()=>{
    const current=createTermSeed();current.people=directory.map(person=>({id:person.id,name:person.data.name,groupId:null,availability:''}));
    const result=importMemberPlan(plan(),current,1,directory,accounts,'2026-10-25T00:00:00.000Z');
    const task=result.document.tasks.find(task=>task.sourcePlan==='dummy-plan')!;
    expect(task).toMatchObject({ownerId:'directory-a',collaboratorIds:['directory-b'],status:'Not started',due:'2026-11-01',dueAt:'2026-11-01T15:59:00.000Z'});
    expect(result.document.events).toHaveLength(current.events.length);
    task.status='In progress';task.update='Saved member progress';
    const repeat=importMemberPlan(plan(),result.document,2,directory,accounts,'2026-10-26T00:00:00.000Z');
    expect(repeat.document).toEqual(result.document);
    expect(repeat.document.tasks.filter(task=>task.sourcePlan==='dummy-plan')).toHaveLength(1);
  });
  it('keeps a directory identity without an account pending instead of making a duplicate login',()=>{
    const current=createTermSeed();current.people=directory.map(person=>({id:person.id,name:person.data.name,groupId:null,availability:''}));
    const result=importMemberPlan(plan(),current,1,directory,accounts.slice(0,1),'2026-10-25T00:00:00.000Z');
    expect(result.document.tasks.find(task=>task.sourcePlan==='dummy-plan')).toMatchObject({ownerId:'directory-a',collaboratorIds:[],pendingAssigneeIds:['directory-b']});
    expect(accounts).toHaveLength(2);
  });
  it('binds explicit IDs, preserves a shared task once and generates no fake events or dates', () => {
    const source = memberPlanSchema.parse(plan());
    const snapshot = JSON.stringify(source);
    const preview = previewMemberPlan(source, directory, accounts, null);
    expect(preview.totals).toMatchObject({ tasks: 1, sharedTasks: 1, readyTasks: 1, linkedMembers: 2, generatedEvents: 0 });
    expect(preview.tasks[0].accountIds).toEqual(['account-a', 'account-b']);
    expect(preview.tasks[0].status).toBe('待确认');
    expect(preview.tasks[0].deadline).toMatchObject({ kind: 'time', at: '2026-11-01T23:59:00+08:00' });
    expect(preview.series[0].firstDate).toBeNull();
    expect(JSON.stringify(source)).toBe(snapshot);
    expect(previewMemberPlan(source, directory, accounts, null)).toEqual(preview);
  });
  it('never binds by a similar name, guesses email or creates accounts', () => {
    const source = plan(); source.members[0].personId = 'unknown';
    const preview = previewMemberPlan(source, directory, accounts.slice(0, 1), null);
    expect(preview.bindings[0]).toMatchObject({ state: 'pending-link', accountId: null });
    expect(preview.bindings[1]).toMatchObject({ state: 'pending-account', accountId: null });
    expect(preview.tasks[0].importReady).toBe(false);
    expect(preview.bindings[2].state).toBe('inactive');
  });
  it('blocks revoked accounts, inactive directory members and changed bindings', () => {
    for (const profiles of [directory.map(p => ({ ...p, data: { ...p.data, status: 'inactive' } })), directory.map(p => ({ ...p, data: { name: 'Changed name' } }))]) {
      expect(previewMemberPlan(plan(), profiles, accounts, null).tasks[0].importReady).toBe(false);
    }
    expect(previewMemberPlan(plan(), directory, accounts.map(a => ({ ...a, state: 'revoked' })), null).tasks[0].accountIds).toEqual([]);
  });
  it('shows before/proposed conflicts without changing the existing workspace', () => {
    const existing = { revision: 6, document: { events: [{ id: 'market', status: 'Confirmed', date: '2026-12-11' }] } };
    const result = previewMemberPlan(plan(), directory, accounts, existing);
    expect(result.corrections[0].prior).toMatchObject({ status: 'Confirmed' });
    expect(result.corrections[0].proposed).toMatchObject({ status: 'Tentative' });
    expect(existing.document.events[0].status).toBe('Confirmed');
    expect(result.persisted).toBe(false);
  });
  it('rejects inactive assignees, duplicate bindings, invented recurrence anchors and accepted execution states', () => {
    const inactive = plan(); inactive.tasks[0].ownerKeys = ['left'];
    const duplicate = plan(); duplicate.members[1].personId = duplicate.members[0].personId;
    const accepted = plan() as unknown as { tasks: { status: string }[] }; accepted.tasks[0].status = '已完成';
    const anchored = plan() as unknown as { series: { firstDate: string | null }[] }; anchored.series[0].firstDate = '2026-11-07';
    for (const input of [inactive, duplicate, accepted, anchored]) expect(memberPlanSchema.safeParse(input).success).toBe(false);
  });
});

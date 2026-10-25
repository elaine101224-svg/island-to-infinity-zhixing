import type { MemberPlan } from './schema';

export type DirectoryPerson = { id: string; data: { name?: string; status?: string } };
export type PlanAccount = { user_id: string; person_id: string; name: string; state: string; role: string };
export type ExistingWorkspace = { revision: number; document: { projects?: { id: string }[]; events?: { id: string; [key: string]: unknown }[] } } | null;

/** Pure dry run. Only stable, explicitly supplied IDs bind accounts. No fuzzy matching. */
export function previewMemberPlan(plan: MemberPlan, directory: DirectoryPerson[], accounts: PlanAccount[], workspace: ExistingWorkspace) {
  const bindings = plan.members.map(member => {
    const profile = directory.find(person => person.id === member.personId);
    const linked = accounts.filter(account => account.person_id === member.personId);
    let state: 'linked' | 'pending-account' | 'pending-link' | 'inactive' = 'pending-link';
    let reason = 'No reviewed directory binding. Do not infer an email or create an account.';
    if (member.state === 'inactive') { state = 'inactive'; reason = 'Excluded from new assignments; retain history.'; }
    else if (profile && profile.data.name === member.expectedDirectoryName) {
      if (['inactive', 'revoked', 'left', 'withdrawn'].includes(profile.data.status ?? '')) {
        state = 'inactive'; reason = 'Directory member is inactive; exclude from new assignments.';
      } else if (linked.length === 0) {
        state = 'pending-account'; reason = 'Directory identity exists; no member account. Use the existing reviewed invitation workflow.';
      } else if (linked.length === 1 && ['active', 'invited'].includes(linked[0].state)) {
        state = 'linked'; reason = linked[0].state === 'active' ? 'Existing active account linked by stable person ID.' : 'Existing invited account linked; sign-in activation remains pending.';
      } else { reason = 'Account is revoked or conflicting. Reconcile before assignment.'; }
    } else if (profile) { reason = 'Directory name changed since the source binding was reviewed. Recheck this ID.'; }
    return { ...member, state, reason, accountId: state === 'linked' ? linked[0].user_id : null, accountState: state === 'linked' ? linked[0].state : null };
  });
  const byKey = new Map(bindings.map(binding => [binding.key, binding]));
  const tasks = plan.tasks.map(task => {
    const owners = task.ownerKeys.map(key => byKey.get(key)!);
    return { ...task, stableId: `${plan.id}:task:${task.id}`, owners,
      importReady: owners.every(owner => owner.state === 'linked'),
      accountIds: owners.flatMap(owner => owner.accountId ? [owner.accountId] : []),
    };
  });
  const corrections = plan.corrections.map(correction => {
    const prior = workspace?.document[correction.section]?.find(record => record.id === correction.recordId) ?? null;
    return { ...correction, prior, proposed: prior ? { ...prior, ...correction.fields } : null,
      applicable: prior !== null,
    };
  });
  return {
    source: { id: plan.id, version: plan.version, updatedOn: plan.updatedOn, schoolYear: plan.schoolYear, timezone: plan.timezone },
    mode: 'preview-only' as const, persisted: false as const, baseRevision: workspace?.revision ?? null,
    bindings, tasks, scopes: plan.scopes, responsibilities: plan.responsibilities, series: plan.series,
    corrections, gaps: plan.gaps,
    totals: { tasks: tasks.length, sharedTasks: tasks.filter(task => task.ownerKeys.length > 1).length,
      readyTasks: tasks.filter(task => task.importReady).length, linkedMembers: bindings.filter(binding => binding.state === 'linked').length,
      pendingMembers: bindings.filter(binding => ['pending-account', 'pending-link'].includes(binding.state)).length,
      responsibilities: plan.responsibilities.length, generatedEvents: 0,
    },
  };
}
export type MemberPlanPreview = ReturnType<typeof previewMemberPlan>;

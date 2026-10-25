'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import type { MemberPlanPreview } from '@/lib/member-plan/preview';

const labels = { linked: 'Linked', 'pending-account': 'Pending account', 'pending-link': 'Pending link', inactive: 'Inactive' };
function deadlineLabel(task: MemberPlanPreview['tasks'][number]) {
  if (task.deadline.kind === 'unscheduled') return `Unscheduled · ${task.deadline.note}`;
  if (task.deadline.kind === 'date') return `${task.deadline.date} · Date only`;
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.deadline.at)) + ' · Asia/Shanghai';
}

export default function ImportPreview() {
  const [preview, setPreview] = useState<MemberPlanPreview | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [member, setMember] = useState(''), [scope, setScope] = useState('');

  async function load(file?: File) {
    setPreview(null); setError(''); setMember(''); setScope('');
    if (!file) return;
    if (file.size > 256_000) { setError('Choose a plan JSON file smaller than 256 KB.'); return; }
    setBusy(true);
    try {
      const plan: unknown = JSON.parse(await file.text());
      const response = await adminFetch('/api/admin/member-plan-preview', { method: 'POST', json: plan });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Preview failed. Please retry.');
      setPreview(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Preview failed. Please retry.'); }
    finally { setBusy(false); }
  }

  const tasks = preview?.tasks.filter(task => (!member || task.ownerKeys.includes(member)) && (!scope || task.scopeId === scope)) ?? [];
  const responsibilities = preview?.responsibilities.filter(row => (!member || row.memberKeys.includes(member)) && (!scope || row.scopeId === scope)) ?? [];
  const names = new Map(preview?.bindings.map(binding => [binding.key, binding.label]));
  const scopeNames = new Map(preview?.scopes.map(row => [row.id, row.title]));
  return <section className="max-w-6xl mx-auto space-y-6 text-earth-dark">
    <header><Link href="/admin/term" className="text-sm underline">Back to Semester</Link><h1 className="text-2xl font-semibold mt-4">Task Import Preview</h1><p className="text-sm text-earth-mid mt-2">Review accounts, confirmed responsibilities and proposed actions before import.</p></header>
    <div className="editor-panel space-y-4">
      <label className="block text-sm font-medium">Plan JSON<input type="file" accept="application/json,.json" disabled={busy} className="editor-input" onChange={event => { void load(event.target.files?.[0]); event.target.value = ''; }}/></label>
      <p className="text-sm text-earth-mid">This preview does not save files, create accounts, assign tasks or change the Calendar. Keep this planning file private.</p>
      {busy && <p role="status">Checking current accounts and planning…</p>}
      {error && <p role="alert">{error}</p>}
      {!preview && !busy && !error && <p className="text-sm text-earth-mid">Choose the reviewed plan file to begin.</p>}
    </div>
    {preview && <>
      <div className="editor-panel space-y-2" role="status"><p className="font-medium">Preview only · No changes saved</p><p className="text-sm">{preview.totals.tasks} actions · {preview.totals.sharedTasks} shared tasks · {preview.totals.responsibilities} confirmed responsibilities · {preview.totals.generatedEvents} generated activities</p><p className="text-sm text-earth-mid">{preview.totals.linkedMembers} linked accounts · {preview.totals.pendingMembers} pending links/accounts · Current planning revision {preview.baseRevision ?? 'not initialized'}. Recheck before importing.</p></div>
      <section className="editor-panel"><h2 className="text-xl font-semibold mb-4">Account Matching</h2><div className="grid gap-4 sm:grid-cols-2">{preview.bindings.map(binding => <article key={binding.key} className="border-t border-sand pt-3"><h3 className="font-medium">{binding.label} · {labels[binding.state]}</h3><p className="text-sm text-earth-mid mt-1">{binding.reason}</p><details className="mt-2 text-xs break-all"><summary className="cursor-pointer py-2">Identity details</summary><p>Directory: {binding.personId ?? 'Pending'}</p><p>Account: {binding.accountId ?? 'Pending'} · {binding.accountState ?? 'No active binding'}</p><p>{binding.bindingEvidence}</p></details></article>)}</div></section>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Member<select className="editor-input" value={member} onChange={event => setMember(event.target.value)}><option value="">All members</option>{preview.bindings.filter(binding => binding.state !== 'inactive').map(binding => <option key={binding.key} value={binding.key}>{binding.label}</option>)}</select></label><label className="text-sm">Family / Project<select className="editor-input" value={scope} onChange={event => setScope(event.target.value)}><option value="">All families and projects</option>{preview.scopes.map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label></div>
      <section className="editor-panel"><h2 className="text-xl font-semibold mb-4">Confirmed Responsibilities</h2>{responsibilities.map(row => <article key={row.id} className="border-t border-sand py-3"><h3 className="font-medium">{row.memberKeys.map(key => names.get(key)).join(' + ')} · {scopeNames.get(row.scopeId)}</h3><p className="text-sm mt-2 whitespace-pre-wrap">{row.description}</p></article>)}{!responsibilities.length && <p>No responsibilities match these filters.</p>}</section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Proposed Actions</h2><p className="text-sm text-earth-mid">All actions begin as 待确认. A confirmed responsibility does not mean the action has been accepted or started.</p>{tasks.map(task => <article key={task.stableId} className="editor-panel space-y-3"><h3 className="font-medium">{task.id} · {task.title}</h3><p className="text-sm">{task.owners.map(owner => owner.label).join(' + ')} · {scopeNames.get(task.scopeId)} · {task.status}</p><p className="text-sm whitespace-pre-wrap">{task.deliverable}</p><p className="text-sm text-earth-mid">{deadlineLabel(task)}</p><p className="text-sm text-earth-mid">{task.timingNote}{task.dependsOn.length ? ` · Depends on ${task.dependsOn.join(', ')}` : ''}</p>{!task.importReady && <p className="text-sm">Account link required before assignment.</p>}</article>)}{!tasks.length && <p>No actions match these filters.</p>}</section>
      <section className="editor-panel"><h2 className="text-xl font-semibold mb-4">Weekly Series</h2>{preview.series.map(series => <article key={series.id} className="border-t border-sand py-3"><h3 className="font-medium">{series.title}</h3><p className="text-sm mt-2">{series.locationRule}</p><p className="text-sm text-earth-mid mt-2">First date and time pending · No instances generated</p></article>)}</section>
      <section className="editor-panel"><h2 className="text-xl font-semibold mb-4">Planning Corrections</h2>{preview.corrections.map(correction => <article key={correction.id} className="border-t border-sand py-3"><h3 className="font-medium">{correction.recordId} · {correction.applicable ? 'Review change' : 'Existing record not found'}</h3><p className="text-sm mt-2">{correction.reason}</p><details className="mt-2 text-sm"><summary className="cursor-pointer py-2">Before / Proposed</summary><pre className="whitespace-pre-wrap break-all text-xs mt-2">{JSON.stringify({ before: correction.prior, proposed: correction.proposed }, null, 2)}</pre></details></article>)}</section>
      <section className="editor-panel"><h2 className="text-xl font-semibold mb-4">Open Decisions</h2><ul className="list-disc pl-5 space-y-2 text-sm">{preview.gaps.map(gap => <li key={gap}>{gap}</li>)}</ul></section>
    </>}
  </section>;
}

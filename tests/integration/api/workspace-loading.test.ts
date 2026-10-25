import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ from: vi.fn(), started: new Set<string>(), release: null as (() => void) | null }));
vi.mock('@/lib/members/auth', async original => {
  const real = await original<typeof import('@/lib/members/auth')>();
  return { ...real, memberService: () => ({ from: m.from }), requireMember: async () => ({ client: { from: m.from }, account: { user_id: 'a', person_id: 'person-a', name: 'Dummy member', email: 'dummy@uwcchina.org', role: 'member', group_id: 'A', state: 'active' } }) };
});
import { GET } from '@/app/api/members/[action]/route';
describe('workspace reads share one parallel data-loading phase', () => {
  it('starts the profile, permitted roster and all five RLS projections and scope metadata before waiting on any one of them', async () => {
    const ready = new Promise<void>(resolve => { m.release = resolve; });
    m.from.mockImplementation((table: string) => {
      const run = async () => { m.started.add(table); await ready; return { data: table === 'team_members' ? { data: { role: 'volunteer' } } : [], error: null }; };
      const q = { in:vi.fn().mockReturnThis(),select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: run, then: (resolve: (value: unknown) => unknown, reject: (cause: unknown) => unknown) => run().then(resolve, reject) };
      return q;
    });
    const pending = GET(new NextRequest('https://islandtoinfinity.online/api/members/workspace'), { params: Promise.resolve({ action: 'workspace' }) });
    try {
      await vi.waitFor(() => expect(m.started.size).toBe(8));
    } finally { m.release?.(); }
    const response = await pending;
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ me: { personId: 'person-a', role: 'member' }, tasks: [], events: [] });
    expect(response.headers.get('cache-control')).toContain('no-store');
    const roster = m.from.mock.results[m.from.mock.calls.findIndex(([table]) => table === 'member_accounts')].value;
    expect(roster.in).toHaveBeenCalledWith('state',['active','invited']);
  });
});

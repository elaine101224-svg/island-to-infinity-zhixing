import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ authorized: false, csrf: null as string | null, from: vi.fn() }));
vi.mock('@/lib/auth', () => ({ validateSession: async () => m.authorized }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: async () => m.csrf }));
vi.mock('@/lib/members/auth', async original => ({ ...await original<typeof import('@/lib/members/auth')>(), memberService: () => ({ from: m.from }) }));
import { POST } from '@/app/api/admin/member-plan-preview/route';
const body = { id: 'dummy', version: 1, schoolYear: '2026–27', updatedOn: '2026-10-25', timezone: 'Asia/Shanghai', members: [], scopes: [], responsibilities: [], tasks: [], series: [], corrections: [], gaps: [] };
const request = (value: unknown = body) => new NextRequest('https://islandtoinfinity.online/api/admin/member-plan-preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) });
beforeEach(() => { m.authorized = false; m.csrf = null; m.from.mockReset().mockImplementation((table: string) => { const q = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null, error: null })), then: (resolve: (data: unknown) => unknown) => Promise.resolve({ data: table === 'term_workspaces' ? null : [], error: null }).then(resolve) }; return q; }); });
describe('private admin import preview endpoint', () => {
  it.each(['member A', 'member B', 'anonymous'])('denies %s before reading any private planning', async () => {
    const response = await POST(request()); expect(response.status).toBe(401); expect(response.headers.get('cache-control')).toContain('no-store'); expect(m.from).not.toHaveBeenCalled();
  });
  it('requires admin CSRF and validates input before querying', async () => {
    m.authorized = true; m.csrf = 'Invalid CSRF'; expect((await POST(request())).status).toBe(403);
    m.csrf = null; expect((await POST(request({ ...body, tasks: [{ status: 'Completed' }] }))).status).toBe(400); expect(m.from).not.toHaveBeenCalled();
  });
  it('reads current records for an admin and returns a dry run with no write methods', async () => {
    m.authorized = true; const response = await POST(request()); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: 'preview-only', persisted: false, totals: { generatedEvents: 0 } });
    expect(m.from.mock.calls.map(call => call[0])).toEqual(['team_members', 'member_accounts', 'term_workspaces']);
  });
  it('does not replace unavailable storage with guessed account bindings', async () => {
    m.authorized = true; m.from.mockImplementation(() => { throw new Error('offline'); });
    const response = await POST(request()); expect(response.status).toBe(503); expect(response.headers.get('cache-control')).toContain('no-store');
  });
});

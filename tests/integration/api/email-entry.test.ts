import { beforeEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({
  account: { user_id: 'member-a', person_id: 'person-a', email: 'dummy@uwcchina.org', role: 'member', state: 'invited', expires_at: '2099-01-01' },
  enabled: true, dbError: null as unknown, actorError: null as Error | null,
  from: vi.fn(), generate: vi.fn(), getUser: vi.fn(), verify: vi.fn(), signOut: vi.fn(),
  save: vi.fn(), clear: vi.fn(), limit: vi.fn(), nativeClient: vi.fn(),
}));
vi.mock('@/lib/members/loadWorkspace',()=>({loadMemberWorkspace:vi.fn(async()=>({me:{personId:'person-a'},tasks:[],personalPlans:[]}))}));
vi.mock('@/lib/auth', () => ({ validateSession: async () => false, createSession: vi.fn(), destroySession: vi.fn() }));
vi.mock('@/lib/members/emailEntry', () => ({ saveEmailEntry: m.save, clearEmailEntry: m.clear }));
vi.mock('@supabase/supabase-js', () => ({ createClient: m.nativeClient }));
vi.mock('@/lib/members/auth', async original => {
  const real = await original<typeof import('@/lib/members/auth')>();
  return { ...real, memberEnabled: () => m.enabled, memberLimit: m.limit,
    memberService: () => ({ from: m.from, auth: { admin: { getUserById: m.getUser, generateLink: m.generate } } }),
    requireMember: async () => { if (m.actorError) throw m.actorError; return { account: m.account }; },
  };
});
import { POST } from '@/app/api/members/[action]/route';
import { MemberError } from '@/lib/members/auth';
const request = (body: unknown = { email: 'dummy@uwcchina.org' }, origin = 'https://islandtoinfinity.online') => new NextRequest(origin + '/api/members/email-entry', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const params = () => ({ params: Promise.resolve({ action: 'email-entry' }) });
beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://islandtoinfinity.online';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy'; process.env.ADMIN_PASSWORD = 'dummy-secret';
  m.enabled = true; m.account.state = 'invited'; m.account.role = 'member'; m.account.expires_at = '2099-01-01'; m.dbError = null; m.actorError = null;
  for (const mock of [m.from, m.generate, m.getUser, m.verify, m.signOut, m.save, m.clear, m.limit, m.nativeClient]) mock.mockReset();
  m.from.mockImplementation(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: { ...m.account }, error: m.dbError })) }));
  m.getUser.mockResolvedValue({ data: { user: { id: 'member-a', email: 'dummy@uwcchina.org' } }, error: null });
  m.generate.mockResolvedValue({ data: { user: { id: 'member-a' }, properties: { hashed_token: 'private-bearer' } }, error: null });
  m.verify.mockResolvedValue({ data: { user: { id: 'member-a' }, session: { access_token: 'private-access', refresh_token: 'private-refresh', user: { id: 'member-a' } } }, error: null });
  m.nativeClient.mockReturnValue({ auth: { verifyOtp: m.verify, signOut: m.signOut } });
});
describe('owner-selected allowlisted email entry', () => {
  it('accepts an existing member, activates only their invitation and sends no email', async () => {
    const response = await POST(request(), params()); expect(response.status).toBe(200);
    expect(m.getUser).toHaveBeenCalledWith('member-a'); expect(m.generate).toHaveBeenCalledWith({ type: 'magiclink', email: 'dummy@uwcchina.org' });
    expect(m.verify).toHaveBeenCalledWith({ token_hash: 'private-bearer', type: 'email' });
    expect(m.save).toHaveBeenCalledOnce(); expect(m.from.mock.results[0].value.update).not.toHaveBeenCalled();
    expect(m.from.mock.results[1].value.update).toHaveBeenCalledWith({ state: 'active' });
    const body = await response.text(); expect(JSON.parse(body).workspace).toMatchObject({me:{personId:'person-a'},personalPlans:[]});expect(body).not.toContain('private-'); expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('rejects unknown, revoked and expired emails without creating any native session', async () => {
    m.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null, error: null })) });
    expect((await POST(request(), params())).status).toBe(403); expect(m.generate).not.toHaveBeenCalled();
    m.from.mockReset().mockImplementation(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: m.account, error: null })) }));
    m.account.state = 'revoked'; expect((await POST(request(), params())).status).toBe(403);
    m.account.state = 'invited'; m.account.expires_at = '2020-01-01'; expect((await POST(request(), params())).status).toBe(403); expect(m.generate).not.toHaveBeenCalled();
  });
  it('keeps administrator authentication separate even with a forged client role', async () => {
    m.account.role = 'admin'; const response = await POST(request(), params()); expect(response.status).toBe(403); expect(await response.json()).toMatchObject({ redirect: '/login' }); expect(m.generate).not.toHaveBeenCalled();
    m.account.role = 'member'; expect((await POST(request({ email: 'dummy@uwcchina.org', role: 'admin' }), params())).status).toBe(400); expect(m.generate).not.toHaveBeenCalled();
  });
  it('rejects mismatched Auth links, cross-origin requests and disabled member access', async () => {
    m.getUser.mockResolvedValue({ data: { user: { email: 'other@uwcchina.org' } }, error: null }); expect((await POST(request(), params())).status).toBe(403); expect(m.generate).not.toHaveBeenCalled();
    expect((await POST(request(undefined, 'https://evil.example'), params())).status).toBe(403);
    m.enabled = false; expect((await POST(request(), params())).status).toBe(503);
  });
  it('clears the issued session when a concurrent revocation denies the final access check', async () => {
    m.actorError = new MemberError('Revoked', 403); expect((await POST(request(), params())).status).toBe(403); expect(m.signOut).toHaveBeenCalled(); expect(m.clear).toHaveBeenCalled();
  });
});

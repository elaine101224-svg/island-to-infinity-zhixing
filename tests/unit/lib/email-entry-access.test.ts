import { beforeEach, describe, it, expect, vi } from 'vitest';
const m = vi.hoisted(() => ({ role: 'member', state: 'active', direct: true, userId: 'a', accountId: 'a', validated: false, getUser: vi.fn() }));
vi.mock('@/lib/members/emailEntry', () => ({ hasEmailEntry: async () => m.direct, emailEntryClient: async () => ({ ...(m.validated?{emailEntryUser:{id:m.userId,email:'dummy@uwcchina.org',email_confirmed_at:'2026-10-25'}}:{}),auth: { getUser: m.getUser.mockImplementation(async () => ({ data: { user: { id: m.userId, email: 'dummy@uwcchina.org', email_confirmed_at: '2026-10-25' } }, error: null })) }, from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { user_id: m.accountId, email: 'dummy@uwcchina.org', state: m.state, role: m.role }, error: null }) }) }) }));
import { requireMember } from '@/lib/members/auth';
beforeEach(() => { process.env.MEMBERS_ENABLED = 'true'; m.role = 'member'; m.state = 'active'; m.direct = true; m.userId = 'a'; m.accountId = 'a';m.validated=false;m.getUser.mockClear(); });
describe('email-only entry preserves the administrator authentication boundary', () => {
  it('marks ordinary member access explicitly as email-only', async () => {
    expect((await requireMember()).account).toMatchObject({ role: 'member', login_method: 'email-only' });
  });
  it('blocks admin access even if the account is promoted after its entry cookie was issued', async () => {
    m.role = 'admin'; await expect(requireMember()).rejects.toThrow(/Admin sign-in/);
    m.direct = false; expect((await requireMember()).account.role).toBe('admin');
  });
  it('reuses only the identity already validated on this request and still checks live account state',async()=>{m.validated=true;expect((await requireMember()).account.role).toBe('member');expect(m.getUser).not.toHaveBeenCalled();m.state='revoked';await expect(requireMember()).rejects.toThrow(/active invitation/);expect(m.getUser).not.toHaveBeenCalled();});
  it('rechecks live revocation on every request', async () => {
    await requireMember(); m.state = 'revoked'; await expect(requireMember()).rejects.toThrow(/active invitation/);
  });
});

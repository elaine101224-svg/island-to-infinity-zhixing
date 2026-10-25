import { beforeEach, describe, it, expect, vi } from 'vitest';
const m = vi.hoisted(() => ({ role: 'member', state: 'active', direct: true, userId: 'a', accountId: 'a' }));
vi.mock('@/lib/members/emailEntry', () => ({ hasEmailEntry: async () => m.direct, emailEntryClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: m.userId, email: 'dummy@uwcchina.org', email_confirmed_at: '2026-10-25' } }, error: null }) }, from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { user_id: m.accountId, email: 'dummy@uwcchina.org', state: m.state, role: m.role }, error: null }) }) }) }));
import { requireMember } from '@/lib/members/auth';
beforeEach(() => { process.env.MEMBERS_ENABLED = 'true'; m.role = 'member'; m.state = 'active'; m.direct = true; m.userId = 'a'; m.accountId = 'a'; });
describe('email-only entry preserves the administrator authentication boundary', () => {
  it('marks ordinary member access explicitly as email-only', async () => {
    expect((await requireMember()).account).toMatchObject({ role: 'member', login_method: 'email-only' });
  });
  it('blocks admin access even if the account is promoted after its entry cookie was issued', async () => {
    m.role = 'admin'; await expect(requireMember()).rejects.toThrow(/Admin sign-in/);
    m.direct = false; expect((await requireMember()).account.role).toBe('admin');
  });
  it('rechecks live revocation on every request', async () => {
    await requireMember(); m.state = 'revoked'; await expect(requireMember()).rejects.toThrow(/active invitation/);
  });
});

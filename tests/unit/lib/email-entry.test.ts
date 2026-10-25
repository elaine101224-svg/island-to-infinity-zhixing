import { describe, it, expect, vi } from 'vitest';
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
import { sealEntrySession, openEntrySession } from '@/lib/members/emailEntry';
import { canEditRoster } from '@/lib/members/roster';
describe('separate email-entry sessions', () => {
  const data = { access_token: 'private-native-access-token', refresh_token: 'private-native-refresh-token', userId: 'member-a', expiresAt: 2000 };
  it('encrypts native tokens, authenticates the cookie and enforces expiry/key rotation', () => {
    const sealed = sealEntrySession(data, 'dummy-test-key');
    expect(sealed).not.toContain(data.access_token); expect(sealed).not.toContain(data.refresh_token);
    expect(openEntrySession(sealed, 'dummy-test-key', 1000)).toEqual(data);
    expect(() => openEntrySession(sealed, 'dummy-test-key', 2000)).toThrow();
    expect(() => openEntrySession(sealed, 'rotated-key', 1000)).toThrow();
    const bytes = Buffer.from(sealed, 'base64url'); bytes[30] ^= 1;
    expect(() => openEntrySession(bytes.toString('base64url'), 'dummy-test-key', 1000)).toThrow();
    expect(() => sealEntrySession(data, '')).toThrow();
  });
  it('does not give email-only entry the special roster-editor permission', () => {
    process.env.MEMBER_ROSTER_EDITORS = 'dummy@uwcchina.org';
    expect(canEditRoster({ email: 'dummy@uwcchina.org', state: 'active', login_method: 'email-only' })).toBe(false);
    expect(canEditRoster({ email: 'dummy@uwcchina.org', state: 'active', login_method: 'verified' })).toBe(true);
    delete process.env.MEMBER_ROSTER_EDITORS;
  });
});

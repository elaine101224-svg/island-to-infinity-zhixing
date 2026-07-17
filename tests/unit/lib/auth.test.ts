import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { makeCookieStore } from '../../helpers/cookies';

const ADMIN_PASSWORD = 'test-secret-password';

function unsetEnv(name: string) {
  Reflect.deleteProperty(process.env as Record<string, string | undefined>, name);
}

function mockCookies(initial: Record<string, string> = {}) {
  const store = makeCookieStore(initial);
  vi.doMock('next/headers', () => ({ cookies: () => store }));
  return store;
}

function makeSessionCookie(expiresAt: number, sig: string) {
  return Buffer.from(JSON.stringify({ expiresAt, sig })).toString('base64');
}

async function loadAuth() {
  return import('@/lib/auth');
}

describe('auth helpers', () => {
  beforeEach(() => {
    unsetEnv('ADMIN_PASSWORD');
    unsetEnv('NODE_ENV');
    vi.resetModules();
  });

  describe('safeEqual', () => {
    it('returns true for identical strings', async () => {
      const { safeEqual } = await loadAuth();
      expect(safeEqual('abc', 'abc')).toBe(true);
    });
    it('returns false for different same-length strings', async () => {
      const { safeEqual } = await loadAuth();
      expect(safeEqual('abc', 'abd')).toBe(false);
    });
    it('returns false for different-length strings', async () => {
      const { safeEqual } = await loadAuth();
      expect(safeEqual('a', 'aa')).toBe(false);
    });
    it('handles empty strings safely', async () => {
      const { safeEqual } = await loadAuth();
      expect(safeEqual('', '')).toBe(true);
      expect(safeEqual('', 'a')).toBe(false);
      expect(safeEqual('a', '')).toBe(false);
    });
  });

  describe('createSession', () => {
    it('returns null when ADMIN_PASSWORD is not configured', async () => {
      const store = mockCookies();
      const { createSession } = await loadAuth();
      expect(await createSession('anything')).toBeNull();
      expect(store.set).not.toHaveBeenCalled();
    });

    it('rejects wrong password', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      const store = mockCookies();
      const { createSession } = await loadAuth();
      expect(await createSession('wrong-password')).toBeNull();
      expect(store.set).not.toHaveBeenCalled();
    });

    it('accepts correct password and writes a session cookie plus a CSRF cookie', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      Reflect.set(process.env, 'NODE_ENV', 'production');
      const store = mockCookies();
      const { createSession } = await loadAuth();
      const sig = await createSession(ADMIN_PASSWORD);
      expect(sig).toBeTruthy();
      expect(store.set).toHaveBeenCalledTimes(2);
      const calls = (store.set as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      const sessionCall = calls.find((c) => c[0] === 'admin_session');
      const csrfCall = calls.find((c) => c[0] === 'admin_csrf');
      expect(sessionCall).toBeDefined();
      expect(csrfCall).toBeDefined();
      const sessionValue = sessionCall?.[1] as string;
      const sessionOpts = sessionCall?.[2] as { httpOnly: boolean; sameSite: string; secure: boolean; path: string };
      expect(typeof sessionValue).toBe('string');
      expect(sessionOpts.httpOnly).toBe(true);
      expect(sessionOpts.sameSite).toBe('strict');
      expect(sessionOpts.secure).toBe(true);
      expect(sessionOpts.path).toBe('/');
      const csrfValue = csrfCall?.[1] as string;
      const csrfOpts = csrfCall?.[2] as { httpOnly: boolean; sameSite: string; secure: boolean; path: string };
      expect(csrfValue).toBe(sig);
      expect(csrfOpts.httpOnly).toBe(false);
      expect(csrfOpts.sameSite).toBe('strict');
      expect(csrfOpts.secure).toBe(true);
      expect(csrfOpts.path).toBe('/');
    });
  });

  describe('validateSession', () => {
    it('returns false when ADMIN_PASSWORD is not configured', async () => {
      mockCookies();
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(false);
    });

    it('returns false when no session cookie is present', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      mockCookies();
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(false);
    });

    it('returns true for a valid, signed, unexpired cookie', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      const expiresAt = Date.now() + 60_000;
      const sig = createHmac('sha256', ADMIN_PASSWORD)
        .update(JSON.stringify({ expiresAt }))
        .digest('hex');
      mockCookies({ admin_session: makeSessionCookie(expiresAt, sig) });
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(true);
    });

    it('rejects an expired cookie even with a valid signature', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      const expiresAt = Date.now() - 10_000;
      const sig = createHmac('sha256', ADMIN_PASSWORD)
        .update(JSON.stringify({ expiresAt }))
        .digest('hex');
      mockCookies({ admin_session: makeSessionCookie(expiresAt, sig) });
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(false);
    });

    it('rejects a tampered cookie with a wrong signature', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      const expiresAt = Date.now() + 60_000;
      mockCookies({ admin_session: makeSessionCookie(expiresAt, 'deadbeef') });
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(false);
    });

    it('rejects a forged cookie with attacker-chosen expiresAt', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
      const fakeSig = createHmac('sha256', 'attacker-password')
        .update(JSON.stringify({ expiresAt }))
        .digest('hex');
      mockCookies({ admin_session: makeSessionCookie(expiresAt, fakeSig) });
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(false);
    });

    it('rejects a cookie whose payload is malformed', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      mockCookies({ admin_session: Buffer.from('not-json').toString('base64') });
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(false);
    });

    it('rejects a cookie whose payload is missing required fields', async () => {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
      const payload = Buffer.from(JSON.stringify({ sig: 'abc' })).toString('base64');
      mockCookies({ admin_session: payload });
      const { validateSession } = await loadAuth();
      expect(await validateSession()).toBe(false);
    });
  });

  describe('destroySession', () => {
    it('removes both session and CSRF cookies', async () => {
      const store = mockCookies();
      const { destroySession } = await loadAuth();
      await destroySession();
      expect(store.delete).toHaveBeenCalledWith('admin_session');
      expect(store.delete).toHaveBeenCalledWith('admin_csrf');
    });
  });

  describe('checkLoginRate', () => {
    it('allows up to the limit then denies further attempts', async () => {
      const { checkLoginRate } = await loadAuth();
      const key = 'rate-test-' + Date.now();
      for (let i = 0; i < 8; i++) expect(checkLoginRate(key)).toBe(true);
      expect(checkLoginRate(key)).toBe(false);
    });

    it('opens a new window after the time passes', async () => {
      process.env.ADMIN_PASSWORD = 'a';
      vi.resetModules();
      const { checkLoginRate: rate } = await loadAuth();
      const key = 'rate-reset-' + Date.now();
      expect(rate(key)).toBe(true);
    });
  });
});

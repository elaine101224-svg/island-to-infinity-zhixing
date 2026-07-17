import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';

function mockCookies(initial: Record<string, string> = {}) {
  const store = { ...initial };
  const cookieStore = {
    get: vi.fn((name: string) =>
      Object.prototype.hasOwnProperty.call(store, name)
        ? { name, value: store[name] as string }
        : undefined
    ),
    set: vi.fn(),
    delete: vi.fn(),
  };
  vi.doMock('next/headers', () => ({ cookies: () => cookieStore }));
  return { cookieStore, store };
}

async function loadCsrf() {
  return import('@/lib/csrf');
}

function makeSessionCookie(expiresAt: number, sig: string, password: string) {
  const recomputed = createHmac('sha256', password)
    .update(JSON.stringify({ expiresAt }))
    .digest('hex');
  return { cookie: Buffer.from(JSON.stringify({ expiresAt, sig })).toString('base64'), recomputed };
}

describe('verifyCsrf', () => {
  beforeEach(() => {
    Reflect.deleteProperty(process.env as Record<string, string | undefined>, 'ADMIN_PASSWORD');
    vi.resetModules();
  });

  it('rejects when the x-csrf-token header is missing', async () => {
    mockCookies();
    const { verifyCsrf } = await loadCsrf();
    const req = new Request('http://localhost/x', { method: 'POST' });
    expect(await verifyCsrf(req)).toMatch(/missing CSRF token header/);
  });

  it('rejects when there is no admin session cookie', async () => {
    mockCookies();
    const { verifyCsrf } = await loadCsrf();
    const req = new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'x-csrf-token': 'whatever' },
    });
    expect(await verifyCsrf(req)).toBe('no admin session');
  });

  it('rejects when the session cookie is malformed', async () => {
    mockCookies({ admin_session: 'not-base64-or-json' });
    const { verifyCsrf } = await loadCsrf();
    const req = new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'x-csrf-token': 'abc' },
    });
    expect(await verifyCsrf(req)).toBe('unreadable session');
  });

  it('rejects when the CSRF token does not match the session signature', async () => {
    mockCookies({
      admin_session: Buffer.from(JSON.stringify({ expiresAt: 1, sig: 'a'.repeat(64) })).toString('base64'),
    });
    const { verifyCsrf } = await loadCsrf();
    const req = new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'x-csrf-token': 'b'.repeat(64) },
    });
    expect(await verifyCsrf(req)).toBe('CSRF token mismatch');
  });

  it('accepts when the CSRF token equals the session signature', async () => {
    const password = 'pw';
    const expiresAt = Date.now() + 60_000;
    const sig = createHmac('sha256', password)
      .update(JSON.stringify({ expiresAt }))
      .digest('hex');
    mockCookies({
      admin_session: Buffer.from(JSON.stringify({ expiresAt, sig })).toString('base64'),
    });
    const { verifyCsrf } = await loadCsrf();
    const req = new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'x-csrf-token': sig },
    });
    expect(await verifyCsrf(req)).toBeNull();
  });

  it('rejects length-mismatched tokens without throwing', async () => {
    mockCookies({
      admin_session: Buffer.from(JSON.stringify({ expiresAt: 1, sig: 'a'.repeat(64) })).toString('base64'),
    });
    const { verifyCsrf } = await loadCsrf();
    const req = new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'x-csrf-token': 'short' },
    });
    expect(await verifyCsrf(req)).toBe('CSRF token mismatch');
  });
});

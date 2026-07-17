import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.ADMIN_PASSWORD = 'integration-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';

type Result = { data: unknown; error: null };
type Query = { select: () => Result; insert: () => Result; update: () => Result; delete: () => Result };

function makeResult(data: unknown = []): Result {
  return { data, error: null };
}

function mockSupabase(impl: { families?: unknown[] } = {}) {
  const ok = makeResult(impl.families ?? []);
  const q: Query = {
    select: () => ok,
    insert: () => makeResult([{}]),
    update: () => makeResult([{}]),
    delete: () => makeResult([{}]),
  };
  vi.doMock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => q) },
  }));
}

type CookieStore = {
  get: (name: string) => { name: string; value: string } | undefined;
  set: (name: string, value: string) => void;
  delete: (name: string) => void;
  _store: Record<string, string>;
};

function makeCookieStore(initial: Record<string, string> = {}): CookieStore {
  const store: Record<string, string> = { ...initial };
  return {
    get: vi.fn((name: string) =>
      Object.prototype.hasOwnProperty.call(store, name)
        ? { name, value: store[name] as string }
        : undefined
    ),
    set: vi.fn((name: string, value: string) => {
      store[name] = value;
    }),
    delete: vi.fn((name: string) => {
      delete store[name];
    }),
    _store: store,
  };
}

function mockCookies(initial: Record<string, string> = {}): CookieStore {
  const store = makeCookieStore(initial);
  vi.doMock('next/headers', () => ({ cookies: () => store }));
  return store;
}

describe('login route', () => {
  beforeEach(() => {
    vi.resetModules();
    unsetEnv('ANTHROPIC_API_KEY');
  });

  it('rejects an empty password', async () => {
    mockCookies();
    const { POST } = await import('@/app/api/admin/login/route');
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects an invalid password with 401', async () => {
    mockCookies();
    const { POST } = await import('@/app/api/admin/login/route');
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'wrong' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('accepts the correct password and sets Cache-Control: no-store', async () => {
    const store = mockCookies();
    const { POST } = await import('@/app/api/admin/login/route');
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'integration-secret' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(store.set).toHaveBeenCalled();
  });
});

describe('admin GET auth gating', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET /api/admin/team returns 401 without a session', async () => {
    mockCookies();
    mockSupabase();
    const { GET } = await import('@/app/api/admin/team/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/activities returns 401 without a session', async () => {
    mockCookies();
    mockSupabase();
    const { GET } = await import('@/app/api/admin/activities/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/families remains publicly readable (anonymized data only)', async () => {
    mockCookies();
    mockSupabase({ families: [{ id: 'f1', pseudonym: 'Kaiyan', consentGiven: true }] });
    const { GET } = await import('@/app/api/admin/families/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
  });
});

describe('health endpoint', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET ?mode=live returns 200 with liveness payload', async () => {
    process.env.ADMIN_PASSWORD = 'integration-secret';
    mockCookies();
    mockSupabase({ families: [] });
    const { GET } = await import('@/app/api/health/route');
    const res = await GET(new Request('http://localhost/api/health?mode=live'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; uptimeMs: number };
    expect(body.status).toBe('live');
    expect(typeof body.uptimeMs).toBe('number');
  });

  it('GET /api/health returns ready when env and supabase are both available', async () => {
    process.env.ADMIN_PASSWORD = 'integration-secret';
    mockCookies();
    mockSupabase({ families: [] });
    const { GET } = await import('@/app/api/health/route');
    const res = await GET(new Request('http://localhost/api/health'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; checks: { env: { ok: boolean }; supabase: { ok: boolean } } };
    expect(body.status).toBe('ready');
    expect(body.checks.env.ok).toBe(true);
    expect(body.checks.supabase.ok).toBe(true);
  });

  it('GET /api/health returns 503 when ADMIN_PASSWORD is missing', async () => {
    unsetEnv('ADMIN_PASSWORD');
    mockCookies();
    mockSupabase({ families: [] });
    const { GET } = await import('@/app/api/health/route');
    const res = await GET(new Request('http://localhost/api/health'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string; checks: { env: { ok: boolean } } };
    expect(body.status).toBe('degraded');
    expect(body.checks.env.ok).toBe(false);
  });
});

function unsetEnv(name: string) {
  Reflect.deleteProperty(process.env as Record<string, string | undefined>, name);
}

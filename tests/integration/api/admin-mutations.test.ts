import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';

function asNext(req: Request): NextRequest {
  return req as unknown as NextRequest;
}

process.env.ADMIN_PASSWORD = 'integration-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';

type Result = { data: unknown; error: null };
type Query = {
  select: () => Result;
  insert: (data?: unknown) => { select: () => Result };
  update: (data?: unknown) => { eq: () => Result };
  delete: () => { eq: () => Result };
};

function makeResult(data: unknown = []): Result {
  return { data, error: null };
}

function mockSupabase(inserted: { lastInsert?: unknown } = {}) {
  const q: Query = {
    select: () => makeResult([]),
    insert: (data?: unknown) => {
      inserted.lastInsert = data;
      return { select: () => makeResult([data ?? {}]) };
    },
    update: (data?: unknown) => {
      inserted.lastInsert = data;
      return { eq: () => makeResult([data ?? {}]) };
    },
    delete: () => ({ eq: () => makeResult([{}]) }),
  };
  vi.doMock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => q) },
  }));
  return inserted;
 }

type CookieStore = {
  get: (name: string) => { name: string; value: string } | undefined;
  set: (name: string, value: string) => void;
  delete: (name: string) => void;
};

function mockCookies(initial: Record<string, string> = {}): CookieStore {
  const store: Record<string, string> = { ...initial };
  return {
    get: vi.fn((name: string) =>
      Object.prototype.hasOwnProperty.call(store, name)
        ? { name, value: store[name] as string }
        : undefined
    ),
    set: vi.fn(),
    delete: vi.fn(),
  };
}

function sessionCookie(expiresAt: number, sig: string) {
  return Buffer.from(JSON.stringify({ expiresAt, sig })).toString('base64');
}

function freshSession() {
  const expiresAt = Date.now() + 60_000;
  const sig = createHmac('sha256', 'integration-secret')
    .update(JSON.stringify({ expiresAt }))
    .digest('hex');
  return { cookie: sessionCookie(expiresAt, sig), sig, expiresAt };
}

describe('admin POST /api/admin/team (CSRF + validation guard)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects POST without a session cookie (401)', async () => {
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies() }));
    mockSupabase();
    const { POST } = await import('@/app/api/admin/team/route');
    const req = new Request('http://localhost/api/admin/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(asNext(req));
    expect(res.status).toBe(401);
  });

  it('rejects POST with session but no CSRF header (403)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    mockSupabase();
    const { POST } = await import('@/app/api/admin/team/route');
    const req = new Request('http://localhost/api/admin/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        role: 'volunteer',
        status: 'active',
        joinedDate: '2024-01-01',
      }),
    });
    const res = await POST(asNext(req));
    expect(res.status).toBe(403);
  });

  it('rejects POST with mismatched CSRF token (403)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    mockSupabase();
    const { POST } = await import('@/app/api/admin/team/route');
    const req = new Request('http://localhost/api/admin/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': 'wrong-token' },
      body: JSON.stringify({
        name: 'Alice',
        role: 'volunteer',
        status: 'active',
        joinedDate: '2024-01-01',
      }),
    });
    const res = await POST(asNext(req));
    expect(res.status).toBe(403);
  });

  it('rejects POST with valid auth but malformed JSON body (400)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    mockSupabase();
    const { POST } = await import('@/app/api/admin/team/route');
    const req = new Request('http://localhost/api/admin/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': session.sig },
      body: '{not json',
    });
    const res = await POST(asNext(req));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Malformed JSON/);
  });

  it('rejects POST with valid auth but invalid schema (400 with issues)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    mockSupabase();
    const { POST } = await import('@/app/api/admin/team/route');
    const req = new Request('http://localhost/api/admin/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': session.sig },
      body: JSON.stringify({ name: 'Alice', role: 'admin' }),
    });
    const res = await POST(asNext(req));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { issues: string[] };
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it('accepts POST with valid auth + CSRF + schema (201)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    const inserted = mockSupabase();
    const { POST } = await import('@/app/api/admin/team/route');
    const req = new Request('http://localhost/api/admin/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': session.sig },
      body: JSON.stringify({
        name: 'Alice',
        role: 'volunteer',
        email: '',
        phone: '',
        status: 'active',
        assignedFamilyIds: [],
        joinedDate: '2024-01-01',
        notes: '',
      }),
    });
    const res = await POST(asNext(req));
    expect(res.status).toBe(201);
    expect(inserted.lastInsert).toBeDefined();
    const body = (await res.json()) as { name: string; id: string };
    expect(body.name).toBe('Alice');
    expect(body.id).toMatch(/^team-/);
  });
});

describe('admin PUT /api/admin/families/[id] (CSRF + validation guard)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects PUT with valid auth + CSRF but malformed body (400)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    mockSupabase();
    const { PUT } = await import('@/app/api/admin/families/[id]/route');
    const req = new Request('http://localhost/api/admin/families/fam-1', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-csrf-token': session.sig },
      body: '{bad',
    });
    const res = await PUT(asNext(req), { params: Promise.resolve({ id: 'fam-1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects PUT with valid auth + CSRF but invalid family body (400)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    mockSupabase();
    const { PUT } = await import('@/app/api/admin/families/[id]/route');
    const req = new Request('http://localhost/api/admin/families/fam-1', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-csrf-token': session.sig },
      body: JSON.stringify({ pseudonym: 'no-location' }),
    });
    const res = await PUT(asNext(req), { params: Promise.resolve({ id: 'fam-1' }) });
    expect(res.status).toBe(400);
  });

  it('accepts PUT with valid auth + CSRF + valid family body (200)', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    const updated = mockSupabase();
    const { PUT } = await import('@/app/api/admin/families/[id]/route');
    const req = new Request('http://localhost/api/admin/families/fam-1', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-csrf-token': session.sig },
      body: JSON.stringify({
        pseudonym: 'Kaiyan Family',
        location: 'Changshu',
        familyComposition: { adults: 2, children: 2, elderly: 0 },
        background: 'b',
        currentSituation: 's',
        keyChallenges: [],
        highlights: [],
        photos: [],
        consentGiven: true,
      }),
    });
    const res = await PUT(asNext(req), { params: Promise.resolve({ id: 'fam-1' }) });
    expect(res.status).toBe(200);
    expect(updated.lastInsert).toBeDefined();
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe('fam-1');
  });
});

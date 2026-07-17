import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

process.env.ADMIN_PASSWORD = 'integration-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';

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

const PNG_BYTES: readonly number[] = [
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
  0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0x9b, 0xa2,
  0x4e, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82,
];

function makePngBytes(): Uint8Array<ArrayBuffer> {
  const ab = new ArrayBuffer(PNG_BYTES.length);
  const view = new Uint8Array(ab);
  view.set(PNG_BYTES);
  return view;
}

describe('POST /api/admin/uploads', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects unauthenticated requests', async () => {
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies() }));
    const { POST } = await import('@/app/api/admin/uploads/route');
    const form = new FormData();
    form.append('file', new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' }));
    const req = new Request('http://localhost/api/admin/uploads', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  it('rejects when CSRF header is missing', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    const { POST } = await import('@/app/api/admin/uploads/route');
    const form = new FormData();
    form.append('file', new File([makePngBytes()], 'a.png', { type: 'image/png' }));
    const req = new Request('http://localhost/api/admin/uploads', {
      method: 'POST',
      body: form,
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(403);
  });

  it('rejects unsupported mime types with 415', async () => {
    const session = freshSession();
    vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
    const { POST } = await import('@/app/api/admin/uploads/route');
    const form = new FormData();
    form.append('file', new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' }));
    const req = new Request('http://localhost/api/admin/uploads', {
      method: 'POST',
      headers: { 'x-csrf-token': session.sig },
      body: form,
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(415);
  });

  it('accepts a valid PNG, writes to disk, and returns a serving URL', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'uploads-test-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir);
    try {
      const session = freshSession();
      vi.doMock('next/headers', () => ({ cookies: () => mockCookies({ admin_session: session.cookie }) }));
      const { POST } = await import('@/app/api/admin/uploads/route');
      const bytes = makePngBytes();
      const form = new FormData();
      form.append('file', new File([bytes], 'pic.png', { type: 'image/png' }));
      const req = new Request('http://localhost/api/admin/uploads', {
        method: 'POST',
        headers: { 'x-csrf-token': session.sig },
        body: form,
      });
      const res = await POST(req as unknown as Parameters<typeof POST>[0]);
      expect(res.status).toBe(201);
      const body = (await res.json()) as { url: string; mime: string; size: number; filename: string };
      expect(body.url).toMatch(/^\/api\/uploads\/[a-f0-9]{16,}\.png$/);
      expect(body.mime).toBe('image/png');
      expect(body.size).toBe(bytes.length);
      const onDisk = readFileSync(path.join(dir, '.uploads', body.filename));
      expect(onDisk.length).toBe(bytes.length);
    } finally {
      cwdSpy.mockRestore();
    }
  });
});

describe('GET /api/uploads/[file]', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rejects unsafe filenames with 400', async () => {
    const { GET } = await import('@/app/api/uploads/[file]/route');
    for (const bad of ['../../etc/passwd', 'foo.png', 'plain', 'a.exe']) {
      const res = await GET(new Request('http://localhost/x') as unknown as Parameters<typeof GET>[0], {
        params: Promise.resolve({ file: bad }),
      });
      expect([400, 404]).toContain(res.status);
    }
  });

  it('streams the file back with correct Content-Type when it exists', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'uploads-serve-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir);
    mkdirSync(path.join(dir, '.uploads'));
    writeFileSync(path.join(dir, '.uploads', 'abc1234567890abcd.png'), makePngBytes());
    try {
      const { GET } = await import('@/app/api/uploads/[file]/route');
      const res = await GET(new Request('http://localhost/x') as unknown as Parameters<typeof GET>[0], {
        params: Promise.resolve({ file: 'abc1234567890abcd.png' }),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/png');
      expect(res.headers.get('Cache-Control')).toContain('immutable');
      expect(res.headers.get('ETag')).toMatch(/^W\//);
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it('returns 404 for an unknown but well-formed filename', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'uploads-serve-miss-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir);
    try {
      const { GET } = await import('@/app/api/uploads/[file]/route');
      const res = await GET(new Request('http://localhost/x') as unknown as Parameters<typeof GET>[0], {
        params: Promise.resolve({ file: '0000000000000000.png' }),
      });
      expect(res.status).toBe(404);
    } finally {
      cwdSpy.mockRestore();
    }
  });
});

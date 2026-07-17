import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_EXPIRY_HOURS = 24;

interface SessionPayload {
  expiresAt: number;
}

interface SignedSession extends SessionPayload {
  sig: string;
}

/**
 * The session is signed with an HMAC keyed on ADMIN_PASSWORD. Because the key
 * never leaves the server, a client cannot forge a valid signature without
 * knowing the password — so tampering with the cookie (e.g. extending
 * expiresAt) is rejected on validation.
 */
function signPayload(payload: SessionPayload, secret: string): string {
  return createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

/** Constant-time string comparison that never throws on length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function createSession(password: string): Promise<string | null> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !safeEqual(password, adminPassword)) {
    return null;
  }

  const payload: SessionPayload = {
    expiresAt: Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
  };
  const sig = signPayload(payload, adminPassword);

  const signedSession: SignedSession = { ...payload, sig };
  const sessionString = Buffer.from(JSON.stringify(signedSession)).toString('base64');

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
    path: '/',
  });

  // CSRF: a separate, JS-readable cookie that mirrors the session signature.
  // The admin client sends it as x-csrf-token on every mutation; the server
  // re-derives the expected value from the httpOnly session cookie. A
  // cross-origin attacker can't read either cookie (SameSite=strict) and
  // can't derive the signature without the password.
  cookieStore.set('admin_csrf', sig, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
    path: '/',
  });

  return sig;
}

export async function validateSession(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return false;
  }

  try {
    const { expiresAt, sig }: SignedSession = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    );

    if (typeof expiresAt !== 'number' || typeof sig !== 'string') {
      return false;
    }

    if (Date.now() > expiresAt) {
      return false;
    }

    const expectedSig = signPayload({ expiresAt }, adminPassword);
    return safeEqual(sig, expectedSig);
  } catch {
    return false;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete('admin_csrf');
}

export function isAdminModeConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

/**
 * Cheap fixed-window limiter for the login endpoint. Suitable for single-process
 * serverless cold-starts; not coordinated across instances. Use a shared store
 * (Redis, Upstash, Supabase) if you scale horizontally.
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 8;

export function checkLoginRate(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

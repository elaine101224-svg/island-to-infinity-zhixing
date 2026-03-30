import { cookies } from 'next/headers';
import { createHash } from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_EXPIRY_HOURS = 24;

interface SessionData {
  hash: string;
  expiresAt: number;
}

function hashSession(sessionId: string): string {
  return createHash('sha256').update(sessionId).digest('hex');
}

function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

export async function createSession(password: string): Promise<string | null> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return null;
  }

  const sessionId = generateSessionId();
  const hash = hashSession(sessionId);
  const expiresAt = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

  const sessionData: SessionData = { hash, expiresAt };
  const sessionString = Buffer.from(JSON.stringify(sessionData)).toString('base64');

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
    path: '/',
  });

  return sessionId;
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return false;
  }

  try {
    const sessionData: SessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    );

    if (Date.now() > sessionData.expiresAt) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function isAdminModeConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

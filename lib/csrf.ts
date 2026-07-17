import { cookies } from 'next/headers';

export const CSRF_HEADER = 'x-csrf-token';
export const CSRF_COOKIE = 'admin_csrf';

/** Constant-time string comparison that doesn't throw on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

interface SignedSession {
  expiresAt: number;
  sig: string;
}

function readSessionSig(value: string): string | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64').toString('utf-8')
    ) as Partial<SignedSession>;
    return typeof parsed.sig === 'string' ? parsed.sig : null;
  } catch {
    return null;
  }
}

/**
 * Verify that the `x-csrf-token` header matches the signature embedded in the
 * `admin_session` cookie. The session cookie is httpOnly so a cross-origin
 * attacker can't read it; the CSRF value sent in the header is exactly the
 * signature, which itself is only derivable with the admin password (HMAC).
 *
 * Returns the reason for failure or null on success — caller turns it into a
 * 403 response.
 */
export async function verifyCsrf(request: Request): Promise<string | null> {
  const token = request.headers.get(CSRF_HEADER);
  if (!token) return 'missing CSRF token header';

  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) return 'no admin session';

  const expected = readSessionSig(session.value);
  if (!expected) return 'unreadable session';

  return safeEqual(expected, token) ? null : 'CSRF token mismatch';
}

'use client';

/**
 * Thin fetch wrapper used by every admin page. On mutating methods it injects
 * the `x-csrf-token` header from the JS-readable `admin_csrf` cookie (mirrors
 * the signature in the httpOnly `admin_session` cookie; see lib/csrf.ts).
 *
 * Use this instead of calling `fetch('/api/admin/...')` directly from any
 * client component — the server will 403 the request otherwise.
 */
const CSRF_COOKIE = 'admin_csrf';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface AdminFetchOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: string;
  body?: BodyInit | null;
  /** When set, the body is JSON-stringified and Content-Type is set. */
  json?: unknown;
  /** Skip CSRF (e.g. login itself, which sets the cookies). */
  skipCsrf?: boolean;
}

export class AdminFetchError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = 'AdminFetchError';
    this.status = status;
    this.payload = payload;
  }
}

export async function adminFetch(
  url: string,
  options: AdminFetchOptions = {}
): Promise<Response> {
  const { skipCsrf, headers: rawHeaders, method: rawMethod, body, json, ...rest } = options;
  const headers = new Headers(rawHeaders ?? undefined);
  const method = (rawMethod ?? 'GET').toUpperCase();

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipCsrf && MUTATING_METHODS.has(method)) {
    const token = readCookie(CSRF_COOKIE);
    if (!token) {
      throw new AdminFetchError(0, 'Missing CSRF cookie - please log in again.', null);
    }
    headers.set('x-csrf-token', token);
  }

  const init: RequestInit = {
    ...rest,
    method,
    headers,
  };
  if (json !== undefined) {
    init.body = typeof json === 'string' ? json : JSON.stringify(json);
  } else if (body !== undefined) {
    init.body = body;
  }

  return fetch(url, init);
}

import { NextResponse, type NextRequest } from 'next/server';
import type { z } from 'zod';
import { validateSession } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/requestId';
import { log } from '@/lib/logger';
import { parseBody } from '@/lib/validation';

export type GuardResult<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; response: NextResponse };

function jsonError(requestId: string, status: number, error: string, issues?: string[]) {
  return NextResponse.json(
    { error, requestId, ...(issues ? { issues } : {}) },
    { status }
  );
}

/**
 * Standard guard stack for every admin mutation:
 *   1. Require `admin_session` cookie.
 *   2. Require `x-csrf-token` header matching the session signature.
 *   3. Parse JSON body (400 on malformed JSON).
 *   4. Validate shape with the supplied zod schema.
 */
export async function guardMutation<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<GuardResult<z.infer<T>>> {
  const requestId = getRequestId(request);

  if (!(await validateSession())) {
    return { ok: false, response: jsonError(requestId, 401, 'Unauthorized') };
  }

  const csrfError = await verifyCsrf(request);
  if (csrfError) {
    log.warn('api.guard.csrf_rejected', { requestId, reason: csrfError });
    return { ok: false, response: jsonError(requestId, 403, csrfError) };
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return { ok: false, response: jsonError(requestId, 400, 'Malformed JSON body') };
  }

  const result = parseBody(schema, parsed);
  if (!result.ok) {
    return { ok: false, response: jsonError(requestId, 400, result.error, result.issues) };
  }
  return { ok: true, data: result.data, requestId };
}

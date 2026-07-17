import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Extract the upstream `x-request-id` header, or generate a fresh UUID for this
 * request. Always returns a non-empty string so logs can be correlated without
 * further null checks.
 */
export function getRequestId(request: Pick<NextRequest, 'headers'> | { headers: Headers }): string {
  const upstream = request.headers.get(REQUEST_ID_HEADER);
  if (upstream && upstream.length <= 200) return upstream;
  return randomUUID();
}

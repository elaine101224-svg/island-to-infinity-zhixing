export class MemberRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function memberRequest(action: string, body?: unknown) {
  const writing = body !== undefined;
  let res: Response;
  try {
    res = await fetch('/api/members/' + action, {
      method: writing ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin',
      headers: writing ? { 'Content-Type': 'application/json' } : {},
      body: writing ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(writing ? 30_000 : 12_000),
    });
  } catch (cause) {
    if (cause instanceof Error && ['TimeoutError', 'AbortError'].includes(cause.name)) {
      throw new MemberRequestError(writing ? 'The request timed out. Reload to check whether your change was saved before retrying.' : 'Loading took too long. Please try again.', 408);
    }
    throw new MemberRequestError('Could not connect. Check your connection and try again.', 0);
  }
  let data;
  try { data=await res.json(); } catch { throw new MemberRequestError(res.ok?'The server returned an unreadable response. Refresh and try again.':'The server could not complete the request. Refresh to check your changes before retrying.',res.ok?502:res.status); }
  if (!res.ok) throw new MemberRequestError(data.error || 'Request failed. Please retry.', res.status);
  return data;
}

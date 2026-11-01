import { afterEach, describe, expect, it, vi } from 'vitest';
import { memberRequest, MemberRequestError } from '@/lib/members/client';
afterEach(() => vi.unstubAllGlobals());
describe('bounded member requests', () => {
  it('preserves unauthorized status so the initial signed-out check is not shown as a failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'Sign in' }, { status: 401 })));
    await expect(memberRequest('workspace')).rejects.toMatchObject({ status: 401 });
  });
  it('turns a timed-out read into an actionable retry error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('Timed out', 'TimeoutError'); }));
    await expect(memberRequest('workspace')).rejects.toMatchObject({ status: 408, message: expect.stringContaining('try again') });
  });
  it('does not imply that an uncertain mutation failed or invite a blind duplicate retry', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('Timed out', 'TimeoutError'); }));
    await expect(memberRequest('change', { action: 'reflect' })).rejects.toThrow(/check whether your change was saved/);
  });
  it('bounds private reads without introducing a shared cache', async () => {
    const fetch = vi.fn(async () => Response.json({ tasks: [] })); vi.stubGlobal('fetch', fetch);
    await expect(memberRequest('workspace')).resolves.toEqual({ tasks: [] });
    expect(fetch).toHaveBeenCalledWith('/api/members/workspace', expect.objectContaining({ cache: 'no-store', credentials: 'same-origin', signal: expect.any(AbortSignal) }));
    expect(new MemberRequestError('Denied', 403).status).toBe(403);
  });
});

it('turns non-JSON server errors into a recoverable message',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response('Gateway unavailable',{status:503})));await expect(memberRequest('workspace')).rejects.toMatchObject({status:503,message:expect.stringContaining('Refresh')});});

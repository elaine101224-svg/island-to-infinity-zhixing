import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient, type Session } from '@supabase/supabase-js';

export const emailEntryCookie = 'iti-member-entry';
const lifetime = 7 * 24 * 60 * 60;
type EntrySession = { access_token: string; refresh_token: string; userId: string; expiresAt: number };
function key(secret: string) {
  if (!secret) throw new Error('Member session encryption is not configured.');
  return createHash('sha256').update('iti-member-entry-v1\0' + secret).digest();
}
/** Native Supabase tokens remain encrypted and server-only, separate from verified login cookies. */
export function sealEntrySession(value: EntrySession, secret: string) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  cipher.setAAD(Buffer.from(emailEntryCookie));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
export function openEntrySession(value: string, secret: string, now = Date.now()): EntrySession {
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.length < 29 || bytes.length > 6000) throw new Error('Invalid member session.');
  const decipher = createDecipheriv('aes-256-gcm', key(secret), bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(emailEntryCookie)); decipher.setAuthTag(bytes.subarray(12, 28));
  const result = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString()) as EntrySession;
  if (typeof result.access_token !== 'string' || typeof result.refresh_token !== 'string' || typeof result.userId !== 'string' || !result.userId || !result.access_token || !result.refresh_token || !Number.isFinite(result.expiresAt) || result.expiresAt <= now) throw new Error('Expired member session.');
  return result;
}
async function writeEntry(value: EntrySession) {
  const jar = await cookies();
  jar.set(emailEntryCookie, sealEntrySession(value, process.env.ADMIN_PASSWORD ?? ''), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    maxAge: Math.max(0, Math.floor((value.expiresAt - Date.now()) / 1000)),
  });
}
export async function saveEmailEntry(session: Session) {
  await writeEntry({ access_token: session.access_token, refresh_token: session.refresh_token, userId: session.user.id, expiresAt: Date.now() + lifetime * 1000 });
}
export async function clearEmailEntry() { (await cookies()).delete(emailEntryCookie); }
export async function hasEmailEntry() { return Boolean((await cookies()).get(emailEntryCookie)?.value); }
export async function emailEntryClient() {
  const jar = await cookies(), raw = jar.get(emailEntryCookie)?.value;
  if (!raw) return null;
  const stored = openEntrySession(raw, process.env.ADMIN_PASSWORD ?? '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Member sign-in is not configured.');
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.setSession(stored);
  if (error || !data.session || data.user?.id !== stored.userId) throw new Error('Member session expired. Enter your email again.');
  if (data.session.access_token !== stored.access_token || data.session.refresh_token !== stored.refresh_token) {
    await writeEntry({ ...stored, access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  }
  return client;
}

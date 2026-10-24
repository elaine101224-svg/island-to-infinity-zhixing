// Native Auth-only probe. Never grants membership or sends email.
// A controller backdates only this disposable identity's recovery_sent_at.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
if (process.env.ITI_ALLOW_PRODUCTION_AUTH_PROBE !== 'true') throw new Error('Explicit production dummy-Auth test opt-in required.');
const env = parseEnv(await readFile('.vercel/.env.production.local', 'utf8'));
assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, 'https://jbukbnmgkmjyfesaqqjq.supabase.co');
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
const email = `iti-dummy-onboarding-${randomUUID()}@uwcchina.org`;
let id, session, cleaned = false, result;
try {
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  assert.equal(created.error, null); id = created.data.user.id;
  assert(!('session' in created.data));
  const initialAccount = await admin.from('member_accounts').select('user_id').eq('user_id', id);
  assert.equal(initialAccount.error, null); assert.deepEqual(initialAccount.data, []);
  console.log('PASS OTP-ready administrative identity has no session or membership');
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  assert.equal(link.error, null);
  const code = link.data.properties.email_otp;
  assert(/^\d{6,8}$/.test(code));
  const verified = await client.auth.verifyOtp({ email, token: code, type: 'email' });
  assert.equal(verified.error, null); assert.equal(verified.data.user.id, id); session = verified.data.session;
  const privateRead = await client.from('member_tasks').select('id');
  assert.equal(privateRead.error, null); assert.deepEqual(privateRead.data, []);
  assert.equal((await client.auth.signOut()).error, null); session = null;
  console.log('PASS Native code sign-in and sign-out work; uninvited identity still reads no tasks');
  const expiring = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  assert.equal(expiring.error, null);
  console.log('READY_EXPIRY ' + JSON.stringify({ id, email }));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Expiry controller timeout')), 120000);
    process.stdin.once('data', () => { clearTimeout(timer); resolve(); }); process.stdin.resume();
  });
  process.stdin.pause();
  const expired = await client.auth.verifyOtp({ email, token: expiring.data.properties.email_otp, type: 'email' });
  if (expired.data.session) session = expired.data.session;
  assert(expired.error, 'Eleven-minute-old code was accepted; expiry is not configured as expected');
  assert.equal(expired.error.code, 'otp_expired');
  const gate = await admin.from('member_settings').select('enabled').single();
  assert.equal(gate.error, null); assert.equal(gate.data.enabled, false);
  result = { checkedAt: new Date().toISOString(), nativeProvisioning: true, sessionRequiresOtp: true, noMembershipGranted: true, expiredAfterElevenMinutes: true, noMailSent: true, memberGateClosed: true };
  console.log('PASS Native expiry rejects an eleven-minute-old code; member gate remains closed');
} finally {
  if (session) await client.auth.signOut();
  if (id) {
    const removed = await admin.auth.admin.deleteUser(id);
    assert.equal(removed.error, null); cleaned = true;
    console.log('PASS Disposable Auth test identity removed');
  }
  if (result) await writeFile('/tmp/iti-invite-auth-result.json', JSON.stringify({ ...result, dummyIdentityRemoved: cleaned }, null, 2), { mode: 0o600 });
}

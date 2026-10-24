// Disposable dummy identities only. Never point this check at production.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const ref = 'iqqdkmlmumosqltgtvjk';
const url = `https://${ref}.supabase.co`;
const key = process.env.ITI_TEST_PUBLISHABLE_KEY;
if (!key || !process.env.ITI_TEST_ACCOUNTS_FILE) throw new Error('Provide test publishable key and private dummy-account file.');
const accounts = JSON.parse(await readFile(process.env.ITI_TEST_ACCOUNTS_FILE, 'utf8'));
assert(accounts.every(a => a.email.startsWith('iti-dummy-') && a.email.endsWith('@uwcchina.org')));
const sessions = {};
const evidence = [];
let completed = false;
async function request(path, token, method = 'GET', body) {
  if(process.env.ITI_TEST_TRACE==='true')console.log('REQUEST '+method+' '+path.split('?')[0]);
  const r = await fetch(url + path, { method, headers: { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(45000) });
  const text = await r.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}
function passed(name) { evidence.push({ name, passed: true }); console.log('PASS ' + name); }
try {
  for (const a of accounts) {
    const r = await request('/auth/v1/token?grant_type=password', null, 'POST', { email: a.email, password: a.password });
    assert.equal(r.status, 200, 'Native Auth dummy sign-in failed');
    assert.equal(r.data.user.id, a.id); sessions[a.person] = r.data;
  }
  passed('Five dummy identities sign in through hosted native Auth');
  const token = who => sessions[who].access_token;
  const tasks = who => request('/rest/v1/member_tasks?select=id,data', token(who));
  if (process.env.ITI_TEST_CONTROL_ONLY !== 'true') {
  assert.deepEqual((await tasks('a')).data.map(x => x.id), ['roles-A']);
  assert.deepEqual((await tasks('b')).data.map(x => x.id), ['roles-B']);
  assert.deepEqual((await tasks('coordinator')).data.map(x => x.id), ['roles-A']);
  assert.equal((await tasks('admin')).data.length, 4);
  assert.deepEqual((await tasks('uninvited')).data, []);
  passed('Hosted RLS isolates groups and ignores forged user metadata');
  assert((await request('/rest/v1/term_workspaces?select=*', token('a'))).status >= 400);
  assert((await request('/rest/v1/member_accounts?user_id=eq.' + accounts[2].id, token('a'), 'PATCH', { role: 'admin' })).status >= 400);
  assert((await request('/rest/v1/member_tasks?select=id', null)).status >= 400);
  passed('Anonymous, master-document and direct role-write access denied');
  const before = (await tasks('a')).data[0].data;
  const update = { id: 'roles-A', expectedUpdatedAt: before.updatedAt, status: 'In progress', update: 'Hosted dummy progress', nextStep: 'Dummy next step', evidence: '' };
  const save = await request('/rest/v1/rpc/member_change', token('a'), 'POST', { action: 'task', payload: update });
  assert.equal(save.status, 200, JSON.stringify(save.data));
  assert.equal((await tasks('coordinator')).data[0].data.update, update.update);
  assert((await request('/rest/v1/rpc/member_change', token('a'), 'POST', { action: 'task', payload: update })).status >= 400);
  assert((await request('/rest/v1/rpc/member_change', token('b'), 'POST', { action: 'task', payload: update })).status >= 400);
  passed('Task persistence, stale-edit detection and cross-group denial over HTTP');
  const reflection = await request('/rest/v1/rpc/member_change', token('a'), 'POST', { action: 'reflect', payload: { summary: 'Hosted dummy reflection', memberId: 'b', groupId: 'B' } });
  assert.equal(reflection.status, 200);
  const reflections = await request('/rest/v1/member_reflections?select=data', token('coordinator'));
  assert.equal(reflections.data[0].data.memberId, 'a');
  assert.deepEqual((await request('/rest/v1/member_reflections?select=data', token('b'))).data, []);
  const review = await request('/rest/v1/rpc/member_change', token('coordinator'), 'POST', { action: 'review', payload: { id: reflections.data[0].data.id } });
  assert.equal(review.status, 200);
  passed('Reflection author binding, group privacy and coordinator review over HTTP');
  const refreshed = await request('/auth/v1/token?grant_type=refresh_token', null, 'POST', { refresh_token: sessions.a.refresh_token });
  assert.equal(refreshed.status, 200); sessions.a = refreshed.data;
  assert.equal((await tasks('a')).data[0].data.update, update.update);
  passed('Native session refresh preserves permitted persistent data');
  }
  if (process.env.ITI_TEST_CONTROLLED === 'true') {
    async function checkpoint(name) {
      console.log('READY ' + name);
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Controller timeout')), 120000);
        process.stdin.once('data', () => { clearTimeout(timer); resolve(); });
        process.stdin.resume();
      });
      process.stdin.pause();
    }
    await checkpoint('revoke member A in the isolated database, then send newline');
    assert.deepEqual((await tasks('a')).data, []);
    assert((await request('/rest/v1/rpc/member_change', token('a'), 'POST', { action: 'reflect', payload: { summary: 'Denied after revocation' } })).status >= 400);
    passed('Revocation blocks an already-issued native access token');
    await checkpoint('disable the isolated database gate, then send newline');
    assert.deepEqual((await tasks('admin')).data, []);
    assert((await request('/rest/v1/rpc/member_change', token('admin'), 'POST', { action: 'reflect', payload: { summary: 'Denied when paused' } })).status >= 400);
    passed('Database emergency stop blocks existing administrator tokens');
  }
  completed = true;
} finally {
  for (const s of Object.values(sessions)) {
    const r = await request('/auth/v1/logout?scope=global', s.access_token, 'POST');
    assert.equal(r.status, 204, 'Native sign-out failed');
  }
  if (Object.keys(sessions).length) passed('Native sign-out completes for all test sessions');
  if (process.env.ITI_TEST_REPORT_FILE) await writeFile(process.env.ITI_TEST_REPORT_FILE, JSON.stringify({ project: ref, checkedAt: new Date().toISOString(), completed, evidence, limits: 'Password-auth fixtures verify native sessions and HTTP/RLS. Email OTP and Next.js browser onboarding require separate validation.' }, null, 2));
}

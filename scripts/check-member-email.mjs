// Local, temporary verification probe. No member access and no token logging.
import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
const email = process.env.ITI_TEST_EMAIL;
if (!email || !/^[^@]+@uwcchina\.org$/.test(email)) throw new Error('An approved school test mailbox is required.');
const origin = 'http://127.0.0.1:3917';
const base = 'https://jbukbnmgkmjyfesaqqjq.supabase.co/auth/v1';
const key = 'sb_publishable_RPzJKQTZrXUxYXHFxJLXPQ_n2xttLRB';
const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'" };
const page = message => `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Island to Infinity · 本机邮件验证</title><style>body{font:18px/1.7 system-ui;background:#faf6ef;color:#382f26;max-width:560px;margin:10vh auto;padding:24px}input,button{font:inherit;padding:12px;border:1px solid #a79985;border-radius:8px}button{background:#63513c;color:white;cursor:pointer}label{display:block;margin-bottom:10px}</style><h1>邮件验证码测试</h1><p>仅用于本机认证测试，不会开放成员权限。验证码不会写入日志或报告。</p>${message || '<form action="/verify" method="post"><label for="code">输入最新邮件里的数字验证码</label><input id="code" name="code" inputmode="numeric" pattern="[0-9]{6,8}" minlength="6" maxlength="8" required autocomplete="one-time-code"><button>验证并退出</button></form>'}</html>`;
async function auth(path, body, token) {
  const r = await fetch(base + path, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
  const text = await r.text(); return { ok: r.ok, status: r.status, data: text ? JSON.parse(text) : null };
}
const server = createServer(async (req, res) => {
  const finish = (status, message) => { res.writeHead(status, headers); res.end(page(message)); };
  if (req.method === 'GET' && req.url === '/') return finish(200, '');
  if (req.method !== 'POST' || req.url !== '/verify' || req.headers.origin !== origin) return finish(403, '<p>请求无效。</p>');
  let text = ''; for await (const chunk of req) { text += chunk; if (text.length > 100) return finish(413, '<p>请求过大。</p>'); }
  const code = new URLSearchParams(text).get('code');
  if (!/^\d{6,8}$/.test(code || '')) return finish(400, '<p>请输入邮件中的 6–8 位数字验证码。</p>');
  let session;
  try {
    const result = await auth('/verify', { email, token: code, type: 'email' });
    if (!result.ok) return finish(400, '<p>验证码无效或过期。请返回并检查最新邮件。</p>');
    session = result.data;
    if (session.user?.email?.toLowerCase() !== email || !session.user?.email_confirmed_at) throw new Error('Identity mismatch');
    const logout = await auth('/logout?scope=global', null, session.access_token);
    if (!logout.ok) throw new Error('Sign-out failed');
    session = null;
    const replay = await auth('/verify', { email, token: code, type: 'email' });
    if (replay.ok) { await auth('/logout?scope=global', null, replay.data.access_token); throw new Error('Replay accepted'); }
    await writeFile('/tmp/iti-email-verification-report.json', JSON.stringify({ checkedAt: new Date().toISOString(), nativeOtp: true, identityConfirmed: true, signedOut: true, replayRejected: true }, null, 2), { mode: 0o600 });
    console.log('PASS Native email OTP, confirmed identity, sign-out and replay rejection');
    return finish(200, '<h2>验证通过</h2><p>邮箱身份已验证，测试会话已退出，验证码重复使用已被拒绝。成员入口仍然关闭。可以回到聊天。</p>');
  } catch {
    return finish(503, '<p>测试未完成，请回到聊天。请勿发送验证码。</p>');
  } finally {
    if (session?.access_token) await auth('/logout?scope=global', null, session.access_token).catch(() => {});
  }
});
server.listen(3917, '127.0.0.1', () => console.log('Local verification ready at ' + origin));

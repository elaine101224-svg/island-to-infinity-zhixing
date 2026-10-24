// Complete HTTP workflow against a disposable LOCAL native Auth/PostgREST/SMTP
// stack and a real Next.js server. Never accepts a hosted or production target.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHmac} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const config=JSON.parse(await readFile(process.env.ITI_LOCAL_TEST_CONFIG,'utf8'));
assert.equal(config.url,'http://127.0.0.1:54325');assert.equal(config.site,'http://127.0.0.1:3931');
const db=createClient(config.url,config.service,{auth:{persistSession:false,autoRefreshToken:false}});
const req=createRequire(import.meta.url),ts=req('typescript');
async function module(name){const m={exports:{}};const source=await readFile(new URL('../lib/term/'+name+'.ts',import.meta.url),'utf8');const schema=name==='seed'?await module('schema'):null;new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(n=>n==='./schema'?schema:req(n),m,m.exports);return m.exports;}
const people=[{id:'admin',group:null,role:'admin'},{id:'coordinator',group:'A',role:'coordinator'},{id:'a',group:'A',role:'member'},{id:'b',group:'B',role:'member'},{id:'expired',group:'A',role:'member'}].map(a=>({...a,email:`iti-dummy-app-${a.id}@uwcchina.org`,jar:new Map()}));
const checks=[];const pass=label=>{checks.push(label);console.log('PASS '+label);};
async function http(path,jar,body,extra={}) {const headers={'Origin':config.site,...extra};if(jar?.size)headers.Cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');if(body!==undefined)headers['Content-Type']='application/json';const r=await fetch(config.site+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});for(const c of r.headers.getSetCookie()){const first=c.split(';')[0],i=first.indexOf('=');const name=first.slice(0,i),v=first.slice(i+1);if(v)jar?.set(name,v);else jar?.delete(name);}const raw=await r.text();let data;try{data=JSON.parse(raw);}catch{data=raw;}return {status:r.status,data,headers:r.headers};}
async function mailList(){const r=await fetch('http://127.0.0.1:54326/api/v1/messages',{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);return (await r.json()).messages;}
async function codeFor(email){for(let n=0;n<30;n++){const list=await mailList();const found=list.find(m=>m.To?.some(to=>to.Address?.toLowerCase()===email));if(found){const r=await fetch('http://127.0.0.1:54326/api/v1/message/'+found.ID);const m=await r.json();const code=(m.HTML||m.Text||'').match(/Island to Infinity test code:\s*(\d{6,8})/);assert(code,'Catch-only email must contain numeric OTP');return code[1];}await new Promise(r=>setTimeout(r,200));}throw Error('Local catch-only email not received');}
function session(jar){const names=[...jar.keys()].filter(k=>k==='iti-member-auth'||/^iti-member-auth\.\d+$/.test(k)).sort((a,b)=>a.localeCompare(b));const value=names.map(n=>jar.get(n)).join('');assert(value.startsWith('base64-'));return JSON.parse(Buffer.from(value.slice(7),'base64url').toString());}
let complete=false;const core=new Map();
try {
 const signup=await fetch(config.url+'/auth/v1/signup',{method:'POST',headers:{apikey:config.anon,'Content-Type':'application/json'},body:JSON.stringify({email:'iti-dummy-app-public@uwcchina.org',password:'dummy-local-password-123'} )});assert.equal(signup.status,422);assert.equal((await signup.json()).error_code,'signup_disabled');
 const anonymous=await fetch(config.url+'/auth/v1/signup',{method:'POST',headers:{apikey:config.anon,'Content-Type':'application/json'},body:'{}'});assert.equal(anonymous.status,422);assert.equal((await anonymous.json()).error_code,'anonymous_provider_disabled');pass('Native public signup and anonymous signup disabled');
 const term=(await module('seed')).createTermSeed();term.people=people.map(p=>({id:p.id,name:'Dummy '+p.id,groupId:p.group,availability:''}));term.tasks[0].ownerId='a';term.tasks[1].ownerId='b';
 assert.equal((await db.from('term_workspaces').insert({id:'2026-27-T1',document:term,revision:1})).error,null);assert.equal((await db.from('member_settings').update({enabled:true}).eq('id',true)).error,null);
 assert.equal((await http('/api/admin/login',core,{password:config.admin})).status,200);
 const forbiddenInvite={email:people[0].email,personId:people[0].id,role:people[0].role,groupId:people[0].group};
 assert.equal((await http('/api/members/invite',core,forbiddenInvite)).status,403);
 assert.equal((await http('/api/members/request-code',new Map(),{email:people[0].email},{Origin:'https://cross-origin.example'})).status,403);
 pass('Actual CSRF and cross-origin rejection before provisioning or sending');
 const initialCount=(await mailList()).length;
 for(const p of people){const r=await http('/api/members/invite',core,{email:p.email,personId:p.id,role:p.role,groupId:p.group},{'x-csrf-token':core.get('admin_csrf')});assert.equal(r.status,201,JSON.stringify(r.data));const row=await db.from('member_accounts').select('*').eq('person_id',p.id).single();assert.equal(row.data.state,'invited');p.userId=row.data.user_id;const user=await db.auth.admin.getUserById(p.userId);assert(user.data.user.email_confirmed_at);assert(!user.data.user.last_sign_in_at);}
 assert.equal((await mailList()).length,initialCount);assert.equal((await http('/api/admin/logout',core,{})).status,200);pass('Next.js invitations preprovision OTP-ready identities without email, session or active membership');
 const a=people.find(p=>p.id==='a');assert.equal((await db.auth.admin.updateUserById(a.userId,{user_metadata:{role:'admin'}})).error,null);
 const expired=people.find(p=>p.id==='expired');assert.equal((await db.from('member_accounts').update({expires_at:'2000-01-01T00:00:00Z'}).eq('user_id',expired.userId)).error,null);
 const before=(await mailList()).length;
 for(const email of ['iti-dummy-app-uninvited@uwcchina.org',expired.email])assert.equal((await http('/api/members/request-code',new Map(),{email})).status,200);
 assert.equal((await mailList()).length,before);assert.equal((await http('/api/members/verify-code',expired.jar,{email:expired.email,code:'12345678'})).status,403);
 assert.equal((await http('/api/members/request-code',new Map(),{email:'outsider@example.org'})).status,400);pass('Uninvited, expired and non-school identities cannot receive usable member access');
 for(const p of people.filter(p=>p.id!=='expired')){
  assert.equal((await http('/api/members/request-code',p.jar,{email:p.email})).status,200);
  const code=await codeFor(p.email);
  if(p.id==='a'){assert.equal((await http('/api/members/verify-code',new Map(),{email:p.email,code:code==='00000000'?'11111111':'00000000'})).status,403);assert.equal((await db.from('member_accounts').select('state').eq('user_id',p.userId).single()).data.state,'invited');}
  const verified=await http('/api/members/verify-code',p.jar,{email:p.email,code});assert.equal(verified.status,200,JSON.stringify(verified.data));assert(verified.headers.getSetCookie().some(c=>/HttpOnly/i.test(c)&&/SameSite=lax/i.test(c)));
  assert.equal((await db.from('member_accounts').select('state').eq('user_id',p.userId).single()).data.state,'active');
  assert.equal((await http('/api/members/verify-code',new Map(),{email:p.email,code})).status,403);
 }
 pass('Complete first-invite → catch-only SMTP numeric OTP → Next.js verify → cookie session → activation; invalid/reused codes rejected');
 const admin=people.find(p=>p.id==='admin'),coordinator=people.find(p=>p.id==='coordinator'),b=people.find(p=>p.id==='b');
 for(const p of [admin,coordinator,a,b]){const r=await http('/api/members/workspace',p.jar);assert.equal(r.status,200);assert.equal(r.data.me.role,p.role);assert.equal(r.data.tasks.length,p.id==='admin'?4:1);if(p.id!=='admin')assert.equal(r.data.tasks[0].id,p.id==='b'?'roles-B':'roles-A');assert.equal((await http('/api/members/access',p.jar)).status,p.id==='admin'?200:403);}
 pass('Actual Next.js workspace and access-management routes enforce admin/coordinator/member scopes and ignore forged metadata');
 let state=(await http('/api/members/workspace',a.jar)).data;let task=state.tasks[0];
 const change={action:'task',payload:{id:task.id,expectedUpdatedAt:task.updatedAt,status:'In progress',update:'Local native app progress',nextStep:'Verify persistence',evidence:''}};
 assert.equal((await http('/api/members/change',a.jar,change)).status,200);
 assert.equal((await http('/api/members/change',a.jar,change)).status,409);assert.equal((await http('/api/members/change',b.jar,change)).status,403);
 const reloaded=(await http('/api/members/workspace',coordinator.jar)).data;task=reloaded.tasks.find(t=>t.id==='roles-A');assert.equal(task.update,change.payload.update);
 assert.equal((await http('/api/members/change',a.jar,{action:'assign',payload:{id:task.id,expectedUpdatedAt:task.updatedAt,ownerId:'a'}})).status,403);
 assert.equal((await http('/api/members/change',coordinator.jar,{action:'assign',payload:{id:task.id,expectedUpdatedAt:task.updatedAt,ownerId:'b'}})).status,400);
 assert.equal((await http('/api/members/change',coordinator.jar,{action:'assign',payload:{id:task.id,expectedUpdatedAt:task.updatedAt,ownerId:'a'}})).status,200);
 task=(await http('/api/members/workspace',a.jar)).data.tasks[0];
 const completion={action:'task',payload:{id:task.id,expectedUpdatedAt:task.updatedAt,status:'Completed',update:'Local native app progress',nextStep:'',evidence:''}};
 assert.equal((await http('/api/members/change',a.jar,completion)).status,400);completion.payload.evidence='Dummy completion artifact';assert.equal((await http('/api/members/change',a.jar,completion)).status,200);
 pass('Persistent task update/reload, stale conflict, cross-group denial, coordinator assignment and required completion evidence');
 assert.equal((await http('/api/members/change',a.jar,{action:'reflect',payload:{summary:'Local native app reflection'}})).status,200);
 const own=(await http('/api/members/workspace',a.jar)).data.reflections;assert.equal(own.length,1);assert.equal((await http('/api/members/workspace',b.jar)).data.reflections.length,0);
 assert.equal((await http('/api/members/change',a.jar,{action:'review',payload:{id:own[0].id}})).status,403);
 assert.equal((await http('/api/members/change',coordinator.jar,{action:'review',payload:{id:own[0].id}})).status,200);
 assert.equal((await http('/api/members/workspace',a.jar)).data.reflections[0].review,'Reviewed');pass('Reflection persistence, privacy and coordinator review through real Next.js routes');
 const current=session(a.jar);const [h,p]=current.access_token.split('.');const payload=JSON.parse(Buffer.from(p,'base64url'));payload.exp=Math.floor(Date.now()/1000)-60;const raw=h+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url');current.access_token=raw+'.'+createHmac('sha256',config.secret).update(raw).digest('base64url');current.expires_at=payload.exp;
 for(const key of [...a.jar.keys()])if(key.startsWith('iti-member-auth'))a.jar.delete(key);a.jar.set('iti-member-auth','base64-'+Buffer.from(JSON.stringify(current)).toString('base64url'));
 const refreshed=await http('/api/members/workspace',a.jar);assert.equal(refreshed.status,200);assert.notEqual(session(a.jar).access_token,current.access_token);pass('Expired SSR access cookie refreshes through native Auth and preserves permitted progress');
 assert.equal((await http('/api/members/access',admin.jar,{userId:b.userId,expectedState:'active',state:'revoked',role:'member'})).status,200);assert.equal((await http('/api/members/workspace',b.jar)).status,403);pass('Admin revocation blocks an already-signed-in member immediately');
 assert.equal((await db.from('member_settings').update({enabled:false}).eq('id',true)).error,null);assert.equal((await http('/api/members/workspace',admin.jar)).status,403);pass('Database emergency stop blocks existing administrator cookies');
 complete=true;
} finally {
 await db.from('member_settings').update({enabled:false}).eq('id',true);
 for(const p of people){if(p.jar.size){const out=await http('/api/members/logout',p.jar,{});assert.equal(out.status,200);assert.equal((await http('/api/members/workspace',p.jar)).status,401);}}
 await writeFile(process.env.ITI_LOCAL_TEST_REPORT,JSON.stringify({checkedAt:new Date().toISOString(),completed:complete,environment:'Disposable local PostgreSQL + GoTrue + PostgREST + SMTP catcher + real Next.js server',realMailSent:false,productionTouched:false,checks,limits:'HTTP application end-to-end; no browser UI interaction or visual acceptance is claimed.'},null,2));
}

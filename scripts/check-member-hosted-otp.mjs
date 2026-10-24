// Isolated native Auth OTP fixtures: no SMTP is used and no real mailbox is contacted.
// The controller installs only token hashes for existing dummy identities. This tests
// verification/session/RLS, not delivery or a browser-driven Next.js onboarding flow.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomInt,createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const ref='iqqdkmlmumosqltgtvjk';
const accounts=JSON.parse(await readFile(process.env.ITI_TEST_ACCOUNTS_FILE,'utf8'));
assert(accounts.every(a=>a.email.startsWith('iti-dummy-')&&a.email.endsWith('@uwcchina.org')));
const file=process.env.ITI_TEST_OTP_FILE;
if(!file)throw Error('Private fixture file required');
if(process.env.ITI_PREPARE_OTP==='true') {
 const fixtures=accounts.map(a=>({...a,code:String(randomInt(10000000,100000000))}));
 await writeFile(file,JSON.stringify(fixtures),{mode:0o600});
 const sql=fixtures.map(a=>`update auth.users set recovery_token='${createHash('sha224').update(a.email+a.code).digest('hex')}',recovery_sent_at=now() where id='${a.id}' and email='${a.email}';`).join('\n');
 await writeFile(file+'.sql',sql,{mode:0o600});
 console.log('Prepared dummy-only token hashes; no email sent.');
} else {
 const fixtures=JSON.parse(await readFile(file,'utf8'));const clients=[];const checks=[];
 try {
 for(const a of fixtures) {
 const client=createClient(`https://${ref}.supabase.co`,process.env.ITI_TEST_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});clients.push(client);
 const {data,error}=await client.auth.verifyOtp({email:a.email,token:a.code,type:'email'});
 assert.equal(error,null,'Native OTP fixture verification failed');assert.equal(data.user.id,a.id);
 const read=await client.from('member_tasks').select('id');assert.equal(read.error,null);
 const expected=a.person==='admin'?4:a.person==='uninvited'?0:1;assert.equal(read.data.length,expected);
 if(expected===1)assert.equal(read.data[0].id,a.person==='b'?'roles-B':'roles-A');
 const reused=await createClient(`https://${ref}.supabase.co`,process.env.ITI_TEST_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}).auth.verifyOtp({email:a.email,token:a.code,type:'email'});assert(reused.error,'OTP reuse must fail');
 const refreshed=await client.auth.refreshSession();assert.equal(refreshed.error,null);
 checks.push(a.person+': native OTP, scoped rows, replay rejection, refresh');console.log('PASS '+checks.at(-1));
 }
 }finally{for(const c of clients)assert.equal((await c.auth.signOut()).error,null);}
 await writeFile(process.env.ITI_TEST_REPORT_FILE,JSON.stringify({project:ref,checkedAt:new Date().toISOString(),checks,signedOut:true,noMailSent:true,limits:'Hash-seeded dummy OTP fixtures test native verification, sessions and hosted RLS. They do not test SMTP delivery, first-code request or Next.js browser onboarding.'},null,2));
}

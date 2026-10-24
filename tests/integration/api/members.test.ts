import {beforeEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
const m=vi.hoisted(()=>({enabled:true,authorized:false,csrf:null as string|null,memberError:null as Error|null,result:{data:null as unknown,error:null as unknown},verify:{data:{user:{id:'dummy-id',email:'alex@uwcchina.org',email_confirmed_at:'2026-10-23'}},error:null as unknown},createUser:vi.fn(async()=>({data:{user:{id:'new-dummy-id'}},error:null})),signIn:vi.fn(async()=>({error:null})),signOut:vi.fn(async()=>({error:null})),limit:vi.fn(),rpc:vi.fn(),from:vi.fn(),account:{user_id:'dummy-id',person_id:'alex',email:'alex@uwcchina.org',role:'member',state:'active',expires_at:'2099-01-01',group_id:'A'}}));
vi.mock('@/lib/auth',()=>({validateSession:async()=>m.authorized}));
vi.mock('@/lib/csrf',()=>({verifyCsrf:async()=>m.csrf}));
vi.mock('@/lib/members/auth',async original=>{
 const real=await original<typeof import('@/lib/members/auth')>();
 return {...real,memberEnabled:()=>m.enabled,memberService:()=>({from:m.from,rpc:m.rpc,auth:{admin:{createUser:m.createUser}}}),memberClient:async()=>({auth:{signInWithOtp:m.signIn,verifyOtp:async()=>m.verify,signOut:m.signOut}}),memberLimit:m.limit,requireMember:async()=>{if(m.memberError)throw m.memberError;return {client:{rpc:m.rpc,from:m.from},account:m.account};}};
});
import {POST,GET} from '@/app/api/members/[action]/route';
import {MemberError} from '@/lib/members/auth';
import {createTermSeed} from '@/lib/term/seed';
const params=(action:string)=>({params:Promise.resolve({action})});
function req(action:string,body:unknown,origin='https://islandtoinfinity.online'){return new NextRequest('https://islandtoinfinity.online/api/members/'+action,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});}
beforeEach(()=>{process.env.NEXT_PUBLIC_SITE_URL='https://islandtoinfinity.online';m.enabled=true;m.authorized=false;m.csrf=null;m.memberError=null;m.result={data:{...m.account},error:null};m.verify.error=null;m.verify.data.user.id='dummy-id';m.createUser.mockClear();m.signIn.mockClear();m.signOut.mockClear();m.limit.mockReset();m.rpc.mockReset().mockResolvedValue({data:{id:'roles-A'},error:null});const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),gt:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),update:vi.fn().mockReturnThis(),maybeSingle:vi.fn(async()=>m.result)};m.from.mockReset().mockReturnValue(q);});
describe('member API authentication and permissions',()=>{
 it('preprovisions an OTP-ready identity while keeping membership invited and sending no email',async()=>{
  m.authorized=true;const doc=createTermSeed();doc.people=[{id:'alex',name:'Alex (dummy)',groupId:'A',availability:''}];
  const inserted:Record<string,unknown>[]=[];
  m.from.mockImplementation((table:string)=>{const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),single:vi.fn(async()=>({data:{document:doc},error:null})),maybeSingle:vi.fn(async()=>({data:null,error:null})),insert:vi.fn(async(row:Record<string,unknown>)=>{if(table==='member_accounts')inserted.push(row);return {data:null,error:null};})};return q;});
  const res=await POST(req('invite',{email:'alex@uwcchina.org',personId:'alex',role:'member',groupId:'A'}),params('invite'));
  expect(res.status).toBe(201);expect(m.createUser).toHaveBeenCalledWith({email:'alex@uwcchina.org',email_confirm:true});
  expect(inserted).toHaveLength(1);expect(inserted[0]).toMatchObject({state:'invited',role:'member',user_id:'new-dummy-id'});expect(Date.parse(inserted[0].expires_at as string)).toBeGreaterThan(Date.now());expect(m.signIn).not.toHaveBeenCalled();
 });
 it('does not activate an invited account when native OTP verification fails',async()=>{
  m.result={data:{...m.account,state:'invited',expires_at:'2099-01-01'},error:null};m.verify.error={message:'invalid OTP'};
  const res=await POST(req('verify-code',{email:'alex@uwcchina.org',code:'123456'}),params('verify-code'));
  expect(res.status).toBe(403);expect(m.from.mock.results[0].value.update).not.toHaveBeenCalled();expect(m.signOut).toHaveBeenCalled();
 });
 it('rejects cross-origin requests before sending any code',async()=>{expect((await POST(req('request-code',{email:'alex@uwcchina.org'},'https://evil.example'),params('request-code'))).status).toBe(403);expect(m.signIn).not.toHaveBeenCalled();});
 it.each(['alex@gmail.com','alex@uwcchina.org.evil.example'])('rejects non-school address %s',async email=>{expect((await POST(req('request-code',{email}),params('request-code'))).status).toBe(400);});
 it('fails closed while launch is disabled',async()=>{m.enabled=false;expect((await POST(req('request-code',{email:'alex@uwcchina.org'}),params('request-code'))).status).toBe(503);expect(m.signIn).not.toHaveBeenCalled();});
 it('only sends native OTP to an authorized account without enabling public signup',async()=>{const res=await POST(req('request-code',{email:'alex@uwcchina.org'}),params('request-code'));expect(res.status).toBe(200);expect(m.signIn).toHaveBeenCalledWith({email:'alex@uwcchina.org',options:{shouldCreateUser:false}});});
 it('returns a generic response without mailing uninvited users',async()=>{m.result={data:null,error:null};const res=await POST(req('request-code',{email:'alex@uwcchina.org'}),params('request-code'));expect(res.status).toBe(200);expect(m.signIn).not.toHaveBeenCalled();expect((await res.json()).message).toContain('If your school email');});
 it('rejects expired invitations before OTP verification',async()=>{m.result={data:{...m.account,state:'invited',expires_at:'2020-01-01'},error:null};expect((await POST(req('verify-code',{email:'alex@uwcchina.org',code:'123456'}),params('verify-code'))).status).toBe(403);});
 it('accepts verified matching identity and rejects reused/invalid OTP',async()=>{expect((await POST(req('verify-code',{email:'alex@uwcchina.org',code:'123456'}),params('verify-code'))).status).toBe(200);m.verify.error={message:'used code'};expect((await POST(req('verify-code',{email:'alex@uwcchina.org',code:'123456'}),params('verify-code'))).status).toBe(403);expect(m.signOut).toHaveBeenCalled();});
 it('rejects identity mismatch even when provider verification succeeds',async()=>{m.verify.data.user.id='another-id';expect((await POST(req('verify-code',{email:'alex@uwcchina.org',code:'123456'}),params('verify-code'))).status).toBe(403);});
 it('cannot manage invitations with a member role or spoofed JSON role',async()=>{expect((await POST(req('invite',{email:'alex@uwcchina.org',personId:'alex',role:'admin',groupId:'A'}),params('invite'))).status).toBe(403);});
 it('rejects forged fields in progress updates and binds reflection author server-side',async()=>{const update={action:'task',payload:{id:'x',expectedUpdatedAt:'now',status:'Completed',update:'',nextStep:'',evidence:'done',ownerId:'attacker'}};expect((await POST(req('change',update),params('change'))).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();expect((await POST(req('change',{action:'reflect',payload:{summary:'Dummy reflection'}}),params('change'))).status).toBe(200);expect(m.rpc).toHaveBeenCalledWith('member_change',{action:'reflect',payload:{summary:'Dummy reflection'}});});
 it.each(['PT409','40001'])('reports stale task conflict %s while preserving draft on client',async code=>{m.rpc.mockResolvedValue({data:null,error:{code}});const body={action:'task',payload:{id:'x',expectedUpdatedAt:'now',status:'In progress',update:'work',nextStep:'next',evidence:''}};expect((await POST(req('change',body),params('change'))).status).toBe(409);});
 it('denies revoked sessions on every workspace load and never caches private responses',async()=>{m.memberError=new MemberError('Revoked',403);const res=await GET(new NextRequest('https://islandtoinfinity.online/api/members/workspace'),params('workspace'));expect(res.status).toBe(403);expect(res.headers.get('cache-control')).toContain('no-store');});
 it('requires CSRF for legacy admin management and supports logout while paused',async()=>{m.authorized=true;m.csrf='bad';expect((await POST(req('access',{}),params('access'))).status).toBe(403);m.enabled=false;expect((await POST(req('logout',{}),params('logout'))).status).toBe(200);expect(m.signOut).toHaveBeenCalled();});
});

import { NextRequest,NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { termSchema } from '@/lib/term/schema';
import { MemberError,memberEnabled,memberService,memberClient,requireMember,allowedMemberEmail,sameOrigin,memberLimit,privateHeaders,dbResult,type MemberAccount } from '@/lib/members/auth';
import { loginSchema,verifySchema,changeSchema,inviteSchema,accessSchema } from '@/lib/members/validation';
import { canEditRoster } from '@/lib/members/roster';
export const dynamic='force-dynamic';
function response(data:unknown,status=200){return NextResponse.json(data,{status,headers:privateHeaders});}
function failure(error:unknown){return response({error:error instanceof MemberError?error.message:'The request could not be completed. Please retry.'},error instanceof MemberError?error.status:503);}
async function manager(request?:Request){
 if(await validateSession()){if(request){const csrf=await verifyCsrf(request);if(csrf)throw new MemberError('Admin CSRF check failed.',403);}return {id:'legacy-core-admin'};}
 const {account}=await requireMember();if(account.role!=='admin')throw new MemberError('Administrator required.',403);return {id:account.user_id};
}
export async function GET(_request:NextRequest,{params}:{params:Promise<{action:string}>}){
 try{
 const {action}=await params;
 if(action==='access'){
 await manager();const db=memberService();const accounts=dbResult(await db.from('member_accounts').select('user_id,email,name,role,group_id,state,expires_at').order('created_at'));const term=dbResult(await db.from('term_workspaces').select('document').eq('id','2026-27-T1').maybeSingle());return response({accounts,people:term?termSchema.parse(term.document).people:[]});
 }
 if(action!=='workspace')return response({error:'Not found'},404);
 const {client,account}=await requireMember();
 const [tasks,reflections,groups,projects,events]=await Promise.all(['member_tasks','member_reflections','member_groups','member_projects','member_events'].map(t=>client.from(t).select('data')));
 let rosterQuery=memberService().from('member_accounts').select('person_id,name,group_id').eq('state','active');
 if(account.role!=='admin')rosterQuery=rosterQuery.eq('group_id',account.group_id??'none');
 const roster=dbResult(await rosterQuery);
 return response({me:{name:account.name,role:account.role,personId:account.person_id,groupId:account.group_id,canEditRoster:canEditRoster(account)},tasks:(dbResult(tasks)??[]).map(x=>x.data),reflections:(dbResult(reflections)??[]).map(x=>x.data),groups:(dbResult(groups)??[]).map(x=>x.data),projects:(dbResult(projects)??[]).map(x=>x.data),events:(dbResult(events)??[]).map(x=>x.data),roster});
 }catch(e){return failure(e);}
}
export async function POST(request:NextRequest,{params}:{params:Promise<{action:string}>}){
 try{
 sameOrigin(request);
 const {action}=await params;
 if(Number(request.headers.get('content-length')??0)>20000)throw new MemberError('Request too large.',413);
 let raw:unknown;try{raw=await request.json();}catch{throw new MemberError('Invalid JSON request.');}
 if(action==='invite'){
 const actor=await manager(request);const parsed=inviteSchema.safeParse(raw);if(!parsed.success)throw new MemberError('Choose a school email, planning member, role and group.');
 const p=parsed.data;if(!allowedMemberEmail(p.email))throw new MemberError('Use an exact uwcchina.org school email.');
 const db=memberService();const stored=dbResult(await db.from('term_workspaces').select('document').eq('id','2026-27-T1').single());
 if(!stored)throw new MemberError('Initialize the Term 1 workspace first.',503);
 const term=termSchema.parse(stored.document);const person=term.people.find(x=>x.id===p.personId&&x.groupId===p.groupId);
 if(!person)throw new MemberError('Select a matching planning member and group. No identity is inferred from names.');
 const existingEmail=dbResult(await db.from('member_accounts').select('user_id').eq('email',p.email).maybeSingle());
 const existingPerson=dbResult(await db.from('member_accounts').select('user_id').eq('person_id',p.personId).maybeSingle());
 const existing=existingEmail||existingPerson;
 if(existing)throw new MemberError('This email or planning member is already authorized. Manage the existing record.',409);
 // Native OTP treats unconfirmed identities as signups, which are disabled.
 // Provision an OTP-ready identity without a password or session. Membership
 // stays invited; only successful native email OTP verification activates it.
 const {data,error}=await db.auth.admin.createUser({email:p.email,email_confirm:true});
 if(error||!data.user)throw new MemberError('Account provisioning failed. Check for an existing Auth identity; reconcile it before retrying.',503);
 const record={user_id:data.user.id,email:p.email,person_id:p.personId,name:person.name,role:p.role,group_id:p.groupId,state:'invited',expires_at:new Date(Date.now()+7*86400000).toISOString()};
 const inserted=await db.from('member_accounts').insert(record);
 if(inserted.error)throw new MemberError('Authorization record was not saved. The Auth identity has no member permissions; reconcile it before retrying.',503);
 dbResult(await db.from('member_access_audit').insert({actor:actor.id,action:'authorize',target:data.user.id}));
 return response({message:'Email authorized for seven days. No invitation email was sent. Share the member sign-in URL only after launch approval.'},201);
 }
 if(action==='access'){
 const actor=await manager(request);const parsed=accessSchema.safeParse(raw);if(!parsed.success)throw new MemberError('Invalid access change.');
 if(parsed.data.userId===actor.id)throw new MemberError('Use another administrator to revoke your own account.');
 const db=memberService();const {error}=await db.rpc('member_manage_access',{target:parsed.data.userId,expected_state:parsed.data.expectedState,next_state:parsed.data.state,next_role:parsed.data.role,actor_id:actor.id});
 if(error)throw new MemberError('Access was not changed. Reload and check the invitation or group binding.',(error.code==='PT409'||error.code==='40001')?409:400);
 return response({message:'Access updated. Existing sessions are checked against this state on every request.'});
 }
 if(action==='logout'){const client=await memberClient();await client.auth.signOut();return response({message:'Signed out.'});}
 if(!memberEnabled())throw new MemberError('Member access has not launched.',503);
 if(action==='request-code'){
 const parsed=loginSchema.safeParse(raw);if(!parsed.success)throw new MemberError('Enter your school email.');const {email}=parsed.data;
 if(!allowedMemberEmail(email))throw new MemberError('Use your uwcchina.org school email.');
 await memberLimit('otp:'+email,4,600);
 const db=memberService();const account=dbResult(await db.from('member_accounts').select('*').eq('email',email).maybeSingle()) as MemberAccount|null;
 if(account&&account.state!=='revoked'&&(account.state==='active'||Date.parse(account.expires_at)>Date.now())){
 const {error}=await (await memberClient()).auth.signInWithOtp({email,options:{shouldCreateUser:false}});if(error)throw new MemberError('Code could not be sent. Wait a minute and retry.',503);
 }
 return response({message:'If your school email has an active invitation, a sign-in code is on its way. Check your inbox and spam folder.'});
 }
 if(action==='verify-code'){
 const parsed=verifySchema.safeParse(raw);if(!parsed.success)throw new MemberError('Enter the code from your email.');const {email,code}=parsed.data;
 if(!allowedMemberEmail(email))throw new MemberError('School email required.',403);await memberLimit('verify:'+email,10,600);
 const db=memberService();const account=dbResult(await db.from('member_accounts').select('*').eq('email',email).maybeSingle()) as MemberAccount|null;
 if(!account||account.state==='revoked'||(account.state==='invited'&&Date.parse(account.expires_at)<=Date.now()))throw new MemberError('Invitation or code is invalid or expired.',403);
 const client=await memberClient();const {data,error}=await client.auth.verifyOtp({email,token:code,type:'email'});
 if(error||!data.user||!data.user.email_confirmed_at||data.user.id!==account.user_id||data.user.email?.toLowerCase()!==email){await client.auth.signOut();throw new MemberError('Invitation or code is invalid or expired.',403);}
 if(account.state==='invited'){
 const activated=dbResult(await db.from('member_accounts').update({state:'active'}).eq('user_id',account.user_id).eq('state','invited').gt('expires_at',new Date().toISOString()).select('user_id').maybeSingle());
 if(!activated){await client.auth.signOut();throw new MemberError('Invitation changed. Request access again.',403);}
 }
 await requireMember();return response({message:'Signed in.'});
 }
 const {client,account}=await requireMember();await memberLimit('write:'+account.user_id,60,60);
 if(action!=='change')return response({error:'Not found'},404);
 const parsed=changeSchema.safeParse(raw);if(!parsed.success)throw new MemberError('Check your update fields and try again.');
 const {data,error}=await client.rpc('member_change',{action:parsed.data.action,payload:parsed.data.payload});
 if(error)throw new MemberError((error.code==='PT409'||error.code==='40001')?'This task changed. Reload before retrying; your draft is still on screen.':error.code==='42501'?'You do not have permission for this record.':'Update was not saved. Check completion evidence and retry.',(error.code==='PT409'||error.code==='40001')?409:error.code==='42501'?403:400);
 return response({record:data,message:'Saved.'});
 }catch(e){return failure(e);}
}

import {it,expect,vi} from 'vitest';
import {makeCookieStore} from '../helpers/cookies';
const state=vi.hoisted(()=>({jar:null as ReturnType<typeof makeCookieStore>|null}));
vi.mock('next/headers',()=>({cookies:async()=>state.jar}));
// Explicit opt-in: only synthetic identities in the independent free test project.
it.skipIf(process.env.RUN_STAGING_AUTH!=='true')('verifies native school Auth identities, personal admin binding and member isolation',async()=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://iqqdkmlmumosqltgtvjk.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='sb_publishable_Jy0gBmHYFZ4yyErwh4uU-w_3V2zDIt7';process.env.MEMBERS_ENABLED='true';process.env.ADMIN_PASSWORD='Dummy-local-admin-signature-only';
 const {memberClient,requireMember}=await import('@/lib/members/auth');const {createSession,validateSession}=await import('@/lib/auth');const sessions=[];
 try{
  state.jar=makeCookieStore();const adminClient=await memberClient();const login=await adminClient.auth.signInWithPassword({email:'leader-check@uwcchina.org',password:'DummyOnly-2026-LeaderTest!'});expect(login.error).toBeNull();sessions.push(adminClient);expect((await requireMember()).account.role).toBe('admin');await createSession(process.env.ADMIN_PASSWORD,'ac150025-0000-4000-8000-000000000001');expect(await validateSession()).toBe(true);const boundSession=state.jar._store.admin_session;
  state.jar=makeCookieStore();const member=await memberClient();expect((await member.auth.signInWithPassword({email:'member-check@uwcchina.org',password:'DummyOnly-2026-LeaderTest!'})).error).toBeNull();sessions.push(member);expect((await requireMember()).account.role).toBe('member');state.jar._store.admin_session=boundSession;expect(await validateSession()).toBe(false);
  expect((await member.from('member_groups').select('id')).data).toEqual([]);expect((await member.from('term_workspaces').select('document')).error).not.toBeNull();expect((await member.from('member_accounts').update({role:'admin'}).eq('user_id','ac150025-0000-4000-8000-000000000002')).error).not.toBeNull();
 }finally{for(const client of sessions)await client.auth.signOut();}
},30000);

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
export class MemberError extends Error {constructor(message:string, public status=400){super(message);}}
export function memberEnabled(){return process.env.MEMBERS_ENABLED==='true';}
export function allowedMemberEmail(email:string){return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@uwcchina\.org$/.test(email);}
export const privateHeaders={'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
export function memberService(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new MemberError('Member storage is not configured.',503);
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function memberClient(){
 const jar=await cookies();const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new MemberError('Member sign-in is not configured.',503);
 return createServerClient(url,key,{cookieOptions:{name:'iti-member-auth',httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7},cookies:{getAll:()=>jar.getAll(),setAll:updates=>{for(const {name,value,options} of updates)jar.set(name,value,options);}}});
}
export type MemberAccount={user_id:string;person_id:string;email:string;name:string;role:'admin'|'coordinator'|'member';group_id:'A'|'B'|'C'|'D'|null;state:'invited'|'active'|'revoked';expires_at:string};
export async function requireMember(){
 if(!memberEnabled())throw new MemberError('Member access has not launched.',503);
 const client=await memberClient();
 const {data,error}=await client.auth.getUser();
 if(error||!data.user||!data.user.email_confirmed_at)throw new MemberError('Sign in with your invited school email.',401);
 const email=data.user.email?.toLowerCase()??'';
 if(!allowedMemberEmail(email))throw new MemberError('School email required.',403);
 const {data:account,error:err}=await client.from('member_accounts').select('*').eq('user_id',data.user.id).maybeSingle();
 if(err)throw new MemberError('Membership could not be checked. Please retry.',503);
 if(!account||account.state!=='active'||account.email!==email)throw new MemberError('An active invitation is required. Ask your coordinator.',403);
 return {client,account:account as MemberAccount};
}
export function sameOrigin(request:Request){
 const origin=request.headers.get('origin'),configured=process.env.NEXT_PUBLIC_SITE_URL;
 if(!configured||!origin||origin!==new URL(configured).origin||request.headers.get('sec-fetch-site')==='cross-site')throw new MemberError('Request origin could not be verified.',403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')throw new MemberError('Use a JSON request.',415);
}
export async function memberLimit(key:string,max:number,seconds:number){
 const hashed=createHash('sha256').update(key).digest('hex');
 const {data,error}=await memberService().rpc('member_limit',{k:hashed,maximum:max,seconds});
 if(error)throw new MemberError('Sign-in temporarily unavailable. Please retry.',503);
 if(!data)throw new MemberError('Too many attempts. Please wait before retrying.',429);
}
export function dbResult<T>(result:{data:T;error:unknown}):T{if(result.error)throw new MemberError('Storage request failed. Your changes are not confirmed.',503);return result.data;}

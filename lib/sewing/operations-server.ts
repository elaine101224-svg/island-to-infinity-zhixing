import {cookies} from 'next/headers';
import {randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {validateSession} from '@/lib/auth';
import {db,hash} from './server';
const scrypt=promisify(scryptCallback);
export const opsCookie='sewing_business';
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/'};
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${key.toString('hex')}`;}
export async function passwordMatches(password:string,stored:string){const [,salt,key]=stored.split(':');const expected=Buffer.from(key||'00'.repeat(64),'hex');const actual=await scrypt(password,salt||'invalid',64) as Buffer;return expected.length===actual.length&&timingSafeEqual(actual,expected);}
export type OpsUser={id:string;name:string;role:'admin'|'owner'|'helper';finance:boolean;requireChange:boolean};
export function result<T>(r:{data:T;error:{message:string;code?:string}|null}):T{if(r.error){const code=r.error.code??'';throw Object.assign(Error(code.startsWith('PT')||code==='P0001'?r.error.message:'服务暂时不可用，请重试'),{status:code.startsWith('PT')?Number(code.slice(2)):code==='P0001'?400:503});}return r.data;}
export async function credentials(){const jar=await cookies(),token=jar.get(opsCookie)?.value;return {session_hash:token?hash(token):'',admin_mode:await validateSession()};}
export async function opsActor(){const credential=await credentials();const user=result(await db().rpc('sewing_ops_actor',credential)) as OpsUser;return {credential,user};}
export async function renew(){const jar=await cookies(),token=jar.get(opsCookie)?.value;if(!token)return;const s=result(await db().from('sewing_ops_sessions').select('*').eq('token_hash',hash(token)).maybeSingle());if(!s||Date.parse(s.expires_at)<=Date.now()||Date.parse(s.absolute_expires_at)<=Date.now())return;const expiry=new Date(Math.min(Date.now()+30*86400000,Date.parse(s.absolute_expires_at)));result(await db().from('sewing_ops_sessions').update({expires_at:expiry.toISOString()}).eq('token_hash',hash(token)));jar.set(opsCookie,token,{...cookieOptions,maxAge:Math.floor((expiry.getTime()-Date.now())/1000)});}

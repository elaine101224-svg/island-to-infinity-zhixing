import {beforeEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
const m=vi.hoisted(()=>({rpc:vi.fn(),limit:vi.fn(),denied:false}));
vi.mock('@/lib/members/auth',async original=>{const real=await original<typeof import('@/lib/members/auth')>();return {...real,requireMember:async()=>{if(m.denied)throw new real.MemberError('Sign in',401);return {client:{rpc:m.rpc},account:{user_id:'a'}};},memberLimit:m.limit};});
import {POST} from '@/app/api/members/coordinator-tasks/route';
const input={action:'create',payload:{id:'ebd798d9-095f-4003-b19e-3893951ba8a5',scopeId:'family',title:'Prepare',deliverable:'A reading plan',ownerIds:['b'],due:null,dueAt:null}};
const req=(data:unknown=input,origin='https://islandtoinfinity.online')=>new NextRequest(origin+'/api/members/coordinator-tasks',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
beforeEach(()=>{process.env.NEXT_PUBLIC_SITE_URL='https://islandtoinfinity.online';m.denied=false;m.rpc.mockReset().mockResolvedValue({data:{id:input.payload.id},error:null});m.limit.mockReset();});
describe('coordinator assignment API',()=>{
 it('uses the native member RPC with no client role decisions or service-role writes',async()=>{const r=await POST(req());expect(r.status).toBe(200);expect(m.rpc).toHaveBeenCalledWith('member_assign_scope_task',{action:'create',payload:{...input.payload,priority:'Normal'}});expect(r.headers.get('cache-control')).toContain('no-store');expect(await r.json()).toMatchObject({record:{id:input.payload.id}});});
 it('rejects cross-origin, anonymous and forged privileged fields',async()=>{expect((await POST(req(input,'https://evil.example'))).status).toBe(403);m.denied=true;expect((await POST(req())).status).toBe(401);m.denied=false;expect((await POST(req({...input,payload:{...input.payload,role:'admin'}}))).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();});
 it.each([['42501',403],['PT409',409],['22007',400]])('preserves database refusal %s as HTTP %s',async(code,status)=>{m.rpc.mockResolvedValue({error:{code,message:'PRIVATE DB detail'},data:null});const response=await POST(req());expect(response.status).toBe(status);expect(await response.text()).not.toContain('PRIVATE');});
});

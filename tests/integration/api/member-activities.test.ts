import {beforeEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
const m=vi.hoisted(()=>({denied:false,rpc:vi.fn(),from:vi.fn(),limit:vi.fn()}));
vi.mock('@/lib/members/auth',async original=>{const real=await original<typeof import('@/lib/members/auth')>();return {...real,requireMember:async()=>{if(m.denied)throw new real.MemberError('Sign in',401);return{account:{user_id:'owner'},client:{rpc:m.rpc,from:m.from}};},memberLimit:m.limit};});
import {GET,POST} from '@/app/api/members/activities/route';
const body={title:'Planning session',date:'2026-10-20',summary:'Reviewed the semester plan',nextStep:'Confirm roles',eventId:null};
const req=(input:unknown=body,origin='https://islandtoinfinity.online')=>new NextRequest('https://islandtoinfinity.online/api/members/activities',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)});
beforeEach(()=>{process.env.NEXT_PUBLIC_SITE_URL='https://islandtoinfinity.online';m.denied=false;m.rpc.mockReset().mockResolvedValue({data:{id:'dummy'},error:null});m.from.mockReset().mockReturnValue({select:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn(async()=>({data:[{data:body}],error:null}))});m.limit.mockReset();});
describe('member-owned activity API',()=>{
 it('requires school-email membership for both reads and writes',async()=>{m.denied=true;expect((await GET()).status).toBe(401);expect((await POST(req())).status).toBe(401);expect(m.rpc).not.toHaveBeenCalled();});
 it('sends only validated activity fields to the actor-bound database RPC',async()=>{const response=await POST(req());expect(response.status).toBe(200);expect(m.rpc).toHaveBeenCalledWith('member_save_activity',{payload:body});expect(response.headers.get('cache-control')).toContain('no-store');});
 it('rejects forged authors, roles and invalid input without a write',async()=>{for(const input of [{...body,user_id:'other'},{...body,role:'admin'},{...body,title:''}])expect((await POST(req(input))).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();});
 it('denies cross-origin submissions before accessing the database',async()=>{expect((await POST(req(body,'https://evil.example'))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
 it.each([['PT409',409],['42501',403]])('preserves the distinct %s error for safe recovery',async(code,status)=>{m.rpc.mockResolvedValue({data:null,error:{code}});expect((await POST(req())).status).toBe(status);});
 it('returns uncached records through the authenticated RLS client',async()=>{const response=await GET();expect(response.status).toBe(200);expect(await response.json()).toEqual({records:[body]});expect(response.headers.get('vary')).toBe('Cookie');});
});

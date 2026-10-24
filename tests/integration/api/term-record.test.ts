import {beforeEach,describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {createTermSeed} from '@/lib/term/seed';
const m=vi.hoisted(()=>({authorized:false,csrf:null as string|null,from:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/auth',()=>({validateSession:async()=>m.authorized}));
vi.mock('@/lib/csrf',()=>({verifyCsrf:async()=>m.csrf}));
vi.mock('@/lib/supabase',()=>({supabase:{from:m.from,rpc:m.rpc}}));
import {POST} from '@/app/api/admin/term/record/route';
const request=(body:unknown)=>new NextRequest('https://islandtoinfinity.online/api/admin/term/record',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{m.authorized=false;m.csrf=null;m.rpc.mockReset().mockResolvedValue({data:{},error:null});m.from.mockReset().mockReturnValue({select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),single:vi.fn(async()=>({data:{document:createTermSeed()},error:null}))});});
describe('individual admin item saves',()=>{
 it('denies unauthorized callers and admin requests without CSRF before storage',async()=>{expect((await POST(request({}))).status).toBe(401);m.authorized=true;m.csrf='CSRF required';expect((await POST(request({}))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
 it('rejects roster editing and invalid completed items',async()=>{m.authorized=true;expect((await POST(request({section:'people',record:{id:'a',name:'Forged'},expected:null}))).status).toBe(400);const record={...createTermSeed().tasks[0],status:'Completed',evidence:''};expect((await POST(request({section:'tasks',record,expected:createTermSeed().tasks[0]}))).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();});
 it('passes a validated item and its original version rather than overwriting the workspace',async()=>{m.authorized=true;const original=createTermSeed().events[0],record={...original,location:'Reviewed location'};expect((await POST(request({section:'events',record,expected:original}))).status).toBe(200);expect(m.rpc).toHaveBeenCalledWith('admin_term_record',{section:'events',record,expected_record:original});});
 it('returns a recoverable conflict for a concurrently edited item',async()=>{m.authorized=true;m.rpc.mockResolvedValue({data:null,error:{code:'PT409'}});const event=createTermSeed().events[0];expect((await POST(request({section:'events',record:event,expected:event}))).status).toBe(409);});
});

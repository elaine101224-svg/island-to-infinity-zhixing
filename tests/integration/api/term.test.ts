import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createTermSeed } from '@/lib/term/seed';
const mocks=vi.hoisted(()=>({authorized:false,csrf:null as string|null,result:{data:null as unknown,error:null as unknown},from:vi.fn()}));
vi.mock('@/lib/auth',()=>({validateSession:vi.fn(async()=>mocks.authorized)}));
vi.mock('@/lib/csrf',()=>({verifyCsrf:vi.fn(async()=>mocks.csrf)}));
vi.mock('@/lib/supabase',()=>({supabase:{from:mocks.from}}));
import { GET, PUT } from '@/app/api/admin/term/route';
function request(body:unknown){return new NextRequest('http://localhost/api/admin/term',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(body)});}
describe('closed Term 1 workspace API',()=>{
 beforeEach(()=>{mocks.authorized=false;mocks.csrf=null;mocks.result={data:null,error:null};process.env.SUPABASE_SERVICE_ROLE_KEY='dummy-test-key';const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),insert:vi.fn().mockReturnThis(),update:vi.fn().mockReturnThis(),maybeSingle:vi.fn(async()=>mocks.result)};mocks.from.mockReset().mockReturnValue(q);});
 it.each(['uninvited','regular member','group coordinator'])('denies %s before member launch, regardless of client role claims',async role=>{expect((await GET()).status).toBe(401);expect((await PUT(request({role,revision:0,document:createTermSeed()}))).status).toBe(401);expect(mocks.from).not.toHaveBeenCalled();});
 it('requires CSRF even for authenticated admins',async()=>{mocks.authorized=true;mocks.csrf='CSRF token required';expect((await PUT(request({revision:0,document:createTermSeed()}))).status).toBe(403);expect(mocks.from).not.toHaveBeenCalled();});
 it('serves private preview only after admin authentication, without requiring database access',async()=>{const req=new NextRequest('http://localhost/api/admin/term?preview=true');expect((await GET(req)).status).toBe(401);mocks.authorized=true;delete process.env.SUPABASE_SERVICE_ROLE_KEY;const res=await GET(req);expect(res.status).toBe(200);expect(res.headers.get('cache-control')).toContain('no-store');expect((await res.json()).document.projects).toHaveLength(9);expect(mocks.from).not.toHaveBeenCalled();});
 it('loads initial snapshot only when no persisted row exists',async()=>{mocks.authorized=true;const res=await GET();expect(res.status).toBe(200);expect(res.headers.get('cache-control')).toContain('no-store');expect(await res.json()).toMatchObject({revision:0,initialized:false});});
 it('never replaces database errors with seed data',async()=>{mocks.authorized=true;mocks.result={data:null,error:{message:'offline'}};expect((await GET()).status).toBe(503);});
 it('persists valid admin changes and reports conflicts without overwriting',async()=>{mocks.authorized=true;mocks.result={data:{revision:2},error:null};expect((await PUT(request({revision:1,document:createTermSeed()}))).status).toBe(200);expect(mocks.from.mock.results[0].value.eq).toHaveBeenCalledWith('revision',1);mocks.result={data:null,error:null};expect((await PUT(request({revision:1,document:createTermSeed()}))).status).toBe(409);mocks.result={data:null,error:{code:'23505'}};expect((await PUT(request({revision:0,document:createTermSeed()}))).status).toBe(409);});
 it('rejects invalid completion and missing service key before storage',async()=>{mocks.authorized=true;const document=createTermSeed();document.tasks[0].status='Completed';expect((await PUT(request({revision:0,document}))).status).toBe(400);delete process.env.SUPABASE_SERVICE_ROLE_KEY;expect((await GET()).status).toBe(503);expect(mocks.from).not.toHaveBeenCalled();});
});

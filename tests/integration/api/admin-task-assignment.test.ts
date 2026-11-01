import {beforeEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {createTermSeed} from '@/lib/term/seed';
const m=vi.hoisted(()=>({authorized:true,csrf:null as string|null,from:vi.fn(),update:vi.fn()}));
vi.mock('@/lib/auth',()=>({validateSession:async()=>m.authorized}));
vi.mock('@/lib/csrf',()=>({verifyCsrf:async()=>m.csrf}));
vi.mock('@/lib/members/auth',async original=>({...await original<typeof import('@/lib/members/auth')>(),memberService:()=>({from:m.from})}));
import {POST} from '@/app/api/admin/member-tasks/route';
const create={id:'cead81d9-095f-4003-b19e-3893951ba8a5',scopeId:'booth',title:'Dummy material',deliverable:'A draft',ownerIds:['a'],due:null,dueAt:null};
const request=(payload:unknown={revision:8,create})=>new NextRequest('https://islandtoinfinity.online/api/admin/member-tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
beforeEach(()=>{m.authorized=true;m.csrf=null;m.from.mockReset();m.update.mockReset();const doc=createTermSeed();doc.people=[{id:'a',name:'Dummy A',groupId:null,availability:''},{id:'b',name:'Dummy B',groupId:null,availability:''}];doc.scopes=[{id:'booth',title:'Dummy Booth',kind:'project',memberIds:['a'],coordinatorIds:[],note:'',sourcePlan:'test'}];m.from.mockImplementation(()=>{const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),single:async()=>({data:{document:doc,revision:8},error:null}),update:m.update,m:0,maybeSingle:async()=>({data:{revision:9},error:null})};m.update.mockReturnValue(q);return q;});});
it('allows admin to add a project-bound undated task through the same revision-guarded master',async()=>{const response=await POST(request());expect(response.status).toBe(200);expect(m.update.mock.calls[0][0].document.tasks.at(-1)).toMatchObject({scopeId:'booth',ownerId:'a',status:'Not started',due:null});});
it('denies ordinary members and missing CSRF before accessing data',async()=>{m.authorized=false;expect((await POST(request())).status).toBe(401);expect(m.from).not.toHaveBeenCalled();m.authorized=true;m.csrf='Invalid CSRF';expect((await POST(request())).status).toBe(403);expect(m.from).not.toHaveBeenCalled();});
it('does not save a stale or cross-project assignment',async()=>{expect((await POST(request({revision:7,create}))).status).toBe(409);expect((await POST(request({revision:8,create:{...create,ownerIds:['b']}}))).status).toBe(400);expect(m.update).not.toHaveBeenCalled();});
it('adds and removes scope members through the authenticated revision guard',async()=>{
 const response=await POST(request({revision:8,membership:{scopeId:'booth',memberIds:['b']}}));
 expect(response.status).toBe(200);
 expect(m.update.mock.calls[0][0].document.scopes[0].memberIds).toEqual(['b']);
});
it('rejects stale, unknown and duplicate memberships without writing',async()=>{
 expect((await POST(request({revision:7,membership:{scopeId:'booth',memberIds:['b']}}))).status).toBe(409);
 expect((await POST(request({revision:8,membership:{scopeId:'missing',memberIds:[]}}))).status).toBe(400);
 expect((await POST(request({revision:8,membership:{scopeId:'booth',memberIds:['unknown']}}))).status).toBe(400);
 expect((await POST(request({revision:8,membership:{scopeId:'booth',memberIds:['a','a']}}))).status).toBe(400);
 expect(m.update).not.toHaveBeenCalled();
});
it('protects membership writes from unauthorized and CSRF requests',async()=>{
 const payload={revision:8,membership:{scopeId:'booth',memberIds:[]}};
 m.authorized=false;expect((await POST(request(payload))).status).toBe(401);
 m.authorized=true;m.csrf='Invalid CSRF';expect((await POST(request(payload))).status).toBe(403);
 expect(m.from).not.toHaveBeenCalled();
});
it('edits task instructions without overwriting member progress and forbids bulk text edits',async()=>{
 const response=await POST(request({revision:8,ids:['roles-A'],patch:{title:'Updated title',deliverable:'Updated instructions',timingNote:'Confirm a time'}}));
 expect(response.status).toBe(200);expect(m.update.mock.calls[0][0].document.tasks[0]).toMatchObject({title:'Updated title',deliverable:'Updated instructions',nextStep:'Updated instructions',status:'Not started'});
 m.update.mockClear();expect((await POST(request({revision:8,ids:['roles-A','roles-B'],patch:{title:'Overwrite all'}}))).status).toBe(400);expect(m.update).not.toHaveBeenCalled();
});

import {beforeEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {createTermSeed} from '@/lib/term/seed';
const m=vi.hoisted(()=>({authorized:true,from:vi.fn(),update:vi.fn()}));
vi.mock('@/lib/auth',()=>({validateSession:async()=>m.authorized}));
vi.mock('@/lib/csrf',()=>({verifyCsrf:async()=>null}));
vi.mock('@/lib/members/auth',async original=>({...await original<typeof import('@/lib/members/auth')>(),memberService:()=>({from:m.from})}));
import {POST} from '@/app/api/admin/member-plan-import/route';
const plan={id:'dummy-plan',version:1,schoolYear:'2026–27',updatedOn:'2026-10-25',timezone:'Asia/Shanghai',members:[],scopes:[],responsibilities:[],tasks:[],series:[],corrections:[],gaps:[]};
const request=()=>new NextRequest('https://islandtoinfinity.online/api/admin/member-plan-import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revision:7,plan})});
function reorder(value:unknown):unknown{if(Array.isArray(value))return value.map(reorder);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).reverse().map(([key,value])=>[key,reorder(value)]));return value;}
beforeEach(()=>{m.authorized=true;m.from.mockReset();m.update.mockReset();const doc=createTermSeed();doc.tasks[0].sourcePlan='dummy-plan';doc.planVersion=1;doc.scopes=[];doc.responsibilities=[];m.from.mockImplementation((table:string)=>{const q={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),update:m.update,single:async()=>({data:{document:reorder(doc),revision:7},error:null}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:table==='term_workspaces'?{document:reorder(doc),revision:7}:[],error:null}).then(resolve)};return q;});});
it('does not write a new revision when JSONB changes key order on an already-imported plan',async()=>{const response=await POST(request());expect(response.status).toBe(200);expect(await response.json()).toMatchObject({changed:false,revision:7});expect(m.update).not.toHaveBeenCalled();});
it('rejects an ordinary or unsigned member before reading or writing import data',async()=>{m.authorized=false;expect((await POST(request())).status).toBe(401);expect(m.from).not.toHaveBeenCalled();});

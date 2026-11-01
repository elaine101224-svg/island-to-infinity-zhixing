import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({scopes:[{id:'family',title:'Confirmed family',kind:'family',memberIds:['a'],coordinatorIds:['b']},{id:'project',title:'Confirmed project',kind:'project',memberIds:['a'],coordinatorIds:['a']}]}));
vi.mock('@/lib/members/auth',()=>({dbResult:(result:{data:unknown;error?:unknown})=>{if(result.error)throw result.error;return result.data;},memberService:()=>({from:(table:string)=>{const result={data:table==='team_members'?['a','b','c'].map(id=>({id,data:{name:id,academicYears:['2026–27']}})):table==='term_workspaces'?{document:{scopes:m.scopes}}:[],error:null};const q={select:()=>q,eq:()=>q,maybeSingle:async()=>result,then:(resolve:(value:unknown)=>void)=>resolve(result)};return q;}})}));
import {readDirectory} from '@/lib/members/directory';
beforeEach(()=>{m.scopes[0].memberIds=['a'];});
it('uses live family and project membership, including coordinators, once per scope',async()=>{
 const rows=await readDirectory();
 expect(rows[0].assignments).toEqual([{id:'family',title:'Confirmed family',kind:'family'},{id:'project',title:'Confirmed project',kind:'project'}]);
 expect(rows[1].assignments).toEqual([{id:'family',title:'Confirmed family',kind:'family'}]);
 expect(rows[2].assignments).toEqual([]);
});
it('reflects changes on the next directory read without changing old group fields',async()=>{
 m.scopes[0].memberIds=['c'];
 const rows=await readDirectory();
 expect(rows[0].assignments.map(scope=>scope.id)).toEqual(['project']);
 expect(rows[2].assignments.map(scope=>scope.id)).toEqual(['family']);
 expect(rows[2].groupId).toBeNull();
});

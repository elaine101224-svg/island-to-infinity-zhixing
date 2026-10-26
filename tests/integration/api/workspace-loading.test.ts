import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ from: vi.fn(), started: new Set<string>(), release: null as (() => void) | null }));
vi.mock('@/lib/members/auth', async original => {
  const real = await original<typeof import('@/lib/members/auth')>();
  return { ...real, memberService: () => ({ from: m.from }), requireMember: async () => ({ client: { from: m.from }, account: { user_id: 'a', person_id: 'person-a', name: 'Dummy member', email: 'dummy@uwcchina.org', role: 'member', group_id: 'A', state: 'active' } }) };
});
import { GET } from '@/app/api/members/[action]/route';
describe('workspace reads share one parallel data-loading phase', () => {
  it('starts the profile, permitted roster and all five RLS projections, private plans and scope metadata before waiting on any one of them', async () => {
    const ready = new Promise<void>(resolve => { m.release = resolve; });
    m.from.mockImplementation((table: string) => {
      const run = async () => { m.started.add(table); await ready; return { data: table === 'team_members' ? { data: { role: 'volunteer' } } : [], error: null }; };
      const q = { in:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: run, then: (resolve: (value: unknown) => unknown, reject: (cause: unknown) => unknown) => run().then(resolve, reject) };
      return q;
    });
    const pending = GET(new NextRequest('https://islandtoinfinity.online/api/members/workspace'), { params: Promise.resolve({ action: 'workspace' }) });
    try {
      await vi.waitFor(() => expect(m.started.size).toBe(9));
    } finally { m.release?.(); }
    const response = await pending;
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ me: { personId: 'person-a', role: 'member' }, tasks: [], events: [], personalPlans: [] });
    expect(response.headers.get('cache-control')).toContain('no-store');
    const roster = m.from.mock.results[m.from.mock.calls.findIndex(([table]) => table === 'member_accounts')].value;
    expect(roster.in).toHaveBeenCalledWith('state',['active','invited']);
  });
  it('returns general project membership even with no assigned task, while excluding unrelated families and roles',async()=>{
    const own={id:'library',title:'Dummy library',kind:'project',memberIds:['person-a'],coordinatorIds:[],note:'Work to assign',sourcePlan:'test'};
    const other={...own,id:'private-family',kind:'family',memberIds:['other']};
    m.from.mockImplementation((table:string)=>{
      const data=table==='term_workspaces'?{document:{planVersion:1,scopes:[own,other],responsibilities:[{id:'own-role',scopeId:'library',memberIds:['person-a'],description:'Participate'},{id:'other-role',scopeId:'private-family',memberIds:['other'],description:'Private'}]}}:table==='team_members'?{data:{role:'volunteer'}}:table==='member_accounts'?[{person_id:'person-a',name:'Dummy member',group_id:'A'},{person_id:'other',name:'Unrelated',group_id:null}]:table==='member_projects'?[{data:{id:'library'}},{data:{id:'private-family'}}]:[];
      const run=async()=>({data,error:null});const q={order:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),in:vi.fn().mockReturnThis(),maybeSingle:run,then:(resolve:(value:unknown)=>unknown)=>run().then(resolve)};return q;
    });
    const response=await GET(new NextRequest('https://islandtoinfinity.online/api/members/workspace'),{params:Promise.resolve({action:'workspace'})});
    expect(response.status).toBe(200);const result=await response.json();expect(result.tasks).toEqual([]);expect(result.scopes.map((scope:{id:string})=>scope.id)).toEqual(['library']);expect(result.responsibilities.map((role:{id:string})=>role.id)).toEqual(['own-role']);expect(result.projects).toEqual([{id:'library'}]);expect(result.roster.map((person:{person_id:string})=>person.person_id)).toEqual(['person-a']);
  });
  it('keeps authorized tasks usable if the private-plan read fails, without exposing storage errors',async()=>{
    m.from.mockImplementation((table:string)=>{
      const run=async()=>({data:table==='team_members'?{data:{role:'volunteer'}}:[],error:table==='member_personal_plans'?{message:'PRIVATE storage detail'}:null});
      return {select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),in:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:vi.fn().mockReturnThis(),maybeSingle:run,then:(resolve:(value:unknown)=>unknown)=>run().then(resolve)};
    });
    const response=await GET(new NextRequest('https://islandtoinfinity.online/api/members/workspace'),{params:Promise.resolve({action:'workspace'})});
    expect(response.status).toBe(200);const body=await response.json();expect(body).toMatchObject({tasks:[],personalPlans:null,personalPlansError:'Your personal plans could not be loaded. Please retry.'});expect(JSON.stringify(body)).not.toContain('PRIVATE');
  });

});

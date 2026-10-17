import { describe,it,expect,vi } from 'vitest';
const mock=vi.hoisted(()=>({select:vi.fn()}));
vi.mock('@/lib/supabase',()=>({supabase:{from:()=>({select:mock.select})}}));
import {getPlans,getTeamMembers} from '@/lib/data';
describe('shared admin data source',()=>{
 it('normalizes historical familyId plans for both list and dashboard',async()=>{mock.select.mockResolvedValue({data:[{id:'old',data:{id:'old',status:'active',familyId:'f1'}},{id:'new',data:{id:'new',status:'active',familyIds:['f2'],objectives:[],activities:[]}}],error:null});const plans=await getPlans();expect(plans).toHaveLength(2);expect(plans[0].familyIds).toEqual(['f1']);expect(plans[1].familyIds).toEqual(['f2']);expect(plans[0].objectives).toEqual([]);});
 it('does not turn database errors into a zero-member roster',async()=>{mock.select.mockResolvedValue({data:null,error:{message:'offline'}});await expect(getTeamMembers()).rejects.toThrow('Unable to load team_members');});
});

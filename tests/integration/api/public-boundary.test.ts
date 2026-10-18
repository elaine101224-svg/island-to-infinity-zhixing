import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({auth:vi.fn(),from:vi.fn(),content:vi.fn()}));
vi.mock('@/lib/auth',()=>({validateSession:mocks.auth}));
vi.mock('@/lib/supabase',()=>({supabase:{from:mocks.from}}));
vi.mock('@/lib/websiteContent',()=>({readPublishedContent:mocks.content}));
import { GET as families } from '@/app/api/admin/families/route';
import { GET as plans } from '@/app/api/admin/plans/route';
import { GET as team } from '@/app/api/admin/team/route';
import { GET as schedule } from '@/app/api/schedule/route';
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue(false);});
describe('server-side public boundaries',()=>{
 it('requires login before reading internal tables',async()=>{for(const get of [families,plans,team])expect((await get()).status).toBe(401);expect(mocks.from).not.toHaveBeenCalled();});
 it('projects only approved calendar fields',async()=>{mocks.content.mockResolvedValue({cards:[{id:'pub',kind:'event',published:true,date:'2026-10-18',title:'Community day',summary:'Public summary',eventType:'meeting',startTime:'19:00',endTime:'20:00',venue:'Public hall',location:'PRIVATE ADDRESS',phone:'PRIVATE PHONE',familyIds:['secret'],notes:'PRIVATE'},{id:'draft',kind:'event',published:false,date:'2026-10-18'}]});const res=await schedule();const events=await res.json();expect(events).toHaveLength(1);expect(JSON.stringify(events)).not.toContain('PRIVATE');expect(events[0]).not.toHaveProperty('familyIds');expect(events[0]).toMatchObject({type:'meeting',startTime:'19:00',endTime:'20:00',location:'Public hall'});});
 it('reports an unavailable schedule as an error, not an empty calendar',async()=>{mocks.content.mockRejectedValue(new Error('offline'));expect((await schedule()).status).toBe(503);});
});

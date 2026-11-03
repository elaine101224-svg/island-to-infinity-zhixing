import {describe,it,expect} from 'vitest';
import {progressTimeline,type ProgressUpdate} from '@/lib/sewing/progress';
import {orderTimeline} from '@/lib/sewing/timeline';
const base=orderTimeline({id:'test',version:1,created_at:'2026-11-04T00:00:00Z',work:null});
const report=(stage:ProgressUpdate['stage'],state:ProgressUpdate['state']):ProgressUpdate=>({id:'test',stage,state,note:'团队更新',occurredOn:null,at:'2026-11-04T01:00:00Z',files:[]});
describe('customer-visible team progress',()=>{
 it('moves to the reported stage without fabricating earlier approvals or dates',()=>{const result=progressTimeline(base,[report('production','doing')],false);expect(result.current).toBe('生产及印花');expect(result.stages.find(s=>s.id==='school')?.state).toBe('pending');expect(result.stages.find(s=>s.id==='production')?.date).toBeNull();expect(base.stages.find(s=>s.id==='production')?.state).toBe('pending');});
 it('labels reported completion as a team record rather than financial confirmation',()=>{const result=progressTimeline(base,[report('bulk','done')],false);expect(result.stages.find(s=>s.id==='bulk')?.state).toBe('recorded');expect(result.current).toBe('交付与尾款');});
 it('keeps the last update for each stage and delivery independent of payment',()=>{const result=progressTimeline(base,[report('sample','doing'),report('sample','done'),report('delivery','done')],true);expect(result.current).toBe('已交付');expect(result.stages.find(s=>s.id==='sample')?.state).toBe('recorded');expect(result.stages.find(s=>s.id==='bulk')?.state).toBe('pending');});
});

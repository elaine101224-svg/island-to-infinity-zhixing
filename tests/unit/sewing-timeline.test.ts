import {describe,it,expect} from 'vitest';
import {createWork,type ManagedOrder} from '@/lib/sewing/operations';
import {orderTimeline,publicOrderTimeline} from '@/lib/sewing/timeline';
const id='4307e39d-bf65-4d1a-958a-b5d737672274';
const base:ManagedOrder={id,version:1,created_at:'2026-11-01T12:00:00Z',work:null,data:{name:'示例卫衣',product:'hoodie',quantity:null,group:'示例House A',wechat:'',date:'',notes:'',caseRecord:{source:'客户提供的实际业务资料',progress:{budget:true,sample:true,paymentNotStarted:true}}}};
describe('shared fixed sewing timeline',()=>{
 it('keeps a delivered historical order out of sampling without inventing settlement',()=>{
  const work=createWork({id,customer:{name:'Ohana',contact:'',organization:'Ohana',channel:'school'},product:'Ohana hoodie',quantity:70,expectedDate:'',template:'make'},'admin','2026-11-01T00:00:00Z');
  work.business='delivered';
  const timeline=orderTimeline({...base,work});
  expect(timeline.current).toBe('交付与尾款');
  expect(timeline.stages.find(s=>s.id==='delivery')?.detail).toContain('已交付');
  expect(timeline.stages.find(s=>s.id==='bulk')?.state).not.toBe('done');
  expect(timeline.stages.find(s=>s.id==='school')?.state).not.toBe('done');
  expect(work.finance?.ledger).toEqual([]);
 });
 it('shows reported sample completion without inventing dates, quantities, approvals or payment',()=>{const timeline=orderTimeline(base);expect(timeline.stages.filter(s=>s.state==='done'||s.state==='recorded').map(s=>s.id)).toEqual(['budget','sample']);expect(timeline.stages.find(s=>s.id==='sample')?.date).toBeNull();expect(timeline.current).toBe('样衣送校确认');expect(timeline.stages.find(s=>s.id==='bulk')?.detail).toContain('付款尚未进行');expect(base.data?.quantity).toBeNull();});
 it('records an existing production order without manufacturing historical confirmation rows',()=>{const order=structuredClone(base);order.data!.quantity=12;order.data!.caseRecord!.progress={budget:true,sample:true,preProductionComplete:true,production:true,paymentNotStarted:true};const t=orderTimeline(order);expect(t.current).toBe('生产及印花');expect(t.completed).toBe(5);expect(t.stages.find(s=>s.id==='approval')?.state).toBe('recorded');expect(t.stages.find(s=>s.id==='approval')?.date).toBeNull();expect(t.stages.find(s=>s.id==='bulk')?.state).toBe('pending');});
 it('places payment after completed production without assuming payment was received',()=>{
  const work=createWork({id,customer:{name:'客户',contact:'',organization:'',channel:'school'},product:'hoodie',quantity:2,expectedDate:'',template:'make'},'admin','2026-11-01T00:00:00Z');
  work.legacy={verified:false,source:'测试',stage:'制作完成，未付款',sampleEvidence:'待补',quoteEvidence:'待补',progress:{budget:true,sample:true,preProductionComplete:true,production:true,paymentNotStarted:true}};
  work.steps=work.steps.map(s=>({...s,status:'done',completedAt:'2026-11-01'}));
  const t=orderTimeline({...base,work});
  expect(t.stages.map(s=>s.id)).toEqual(['budget','sample','school','quote','approval','production','bulk','delivery']);
  expect(t.current).toBe('付款');expect(t.stages.find(s=>s.id==='bulk')?.state).toBe('current');
  expect(work.finance?.ledger).toHaveLength(0);
 });
 it('uses the same required production sequence for make, purchase and repeat orders',()=>{const works=(['make','purchase','repeat'] as const).map(template=>createWork({id,customer:{name:'客户',contact:'',organization:'',channel:'school'},product:'hoodie',quantity:2,expectedDate:'',template},'admin','2026-11-01T00:00:00Z'));for(const w of works){expect(w.steps.map(s=>s.title)).toEqual(works[0].steps.map(s=>s.title));expect(w.steps.find(s=>s.kind==='bulk')?.title).toBe('大货制作');}});
 it('does not infer past approvals from reported production and never projects internal data',()=>{const work=createWork({id,customer:{name:'客户',contact:'PRIVATE_WECHAT',organization:'',channel:'school'},product:'hoodie',quantity:2,expectedDate:'',template:'make'},'SECRET_ACCOUNT','2026-11-01T00:00:00Z');work.legacy={verified:false,source:'PRIVATE_SOURCE',stage:'制作中',sampleEvidence:'待核对',quoteEvidence:'待核对',progress:{sample:true,production:true,paymentNotStarted:true}};work.finance!.ledger=[{id,kind:'cost',amountCents:499999,category:'labor',payee:'PRIVATE_SUPPLIER',note:'PRIVATE_NOTE',date:'2026-11-01',proofIds:[]}];const t=publicOrderTimeline({...base,work},[]),serialized=JSON.stringify(t);expect(t.stages.find(s=>s.id==='approval')?.state).toBe('pending');expect(t.stages.find(s=>s.id==='bulk')?.state).toBe('pending');expect(serialized).not.toMatch(/PRIVATE|SECRET|499999|ledger|accountIds|finance|payee/);});
});

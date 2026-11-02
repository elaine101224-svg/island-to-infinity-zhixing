import {approvalValid,amounts,type ManagedOrder,type Confirmation} from './operations';
export const workflow=[
 {id:'budget',title:'需求与心理预算',hint:'沟通产品、数量、设计与预算'},
 {id:'sample',title:'免费打样',hint:'打样免费，目标一周内完成，日期另行确认'},
 {id:'school',title:'样衣送校确认',hint:'送校并由客户确认当前版本样衣'},
 {id:'quote',title:'最终报价',hint:'样衣确认后给出正式报价'},
 {id:'approval',title:'客户确认报价',hint:'客户明确确认报价版本'},
 {id:'production',title:'生产及印花',hint:'确认报价后开始制作，印花由合作团队完成'},
 // Retain the stage ID used by existing clients; payment now follows production.
 {id:'bulk',title:'付款',hint:'制作完成后，按本单约定付款'},
 {id:'delivery',title:'交付与尾款',hint:'交付验收，核对尾款；支持免费补做'},
] as const;
export type StageId=typeof workflow[number]['id'];
export type ReportedProgress={budget?:boolean;sample?:boolean;schoolDelivery?:boolean;production?:boolean;delivery?:boolean;paymentNotStarted?:boolean;preProductionComplete?:boolean};
export type TimelineStage={id:StageId;title:string;hint:string;state:'done'|'current'|'pending'|'review'|'recorded';detail:string;date:string|null};
export type OrderTimelineData={stages:TimelineStage[];current:string;completed:number;total:number;updatedAt:string|null};
export function orderTimeline(order:ManagedOrder,confirmations:Confirmation[]=[]):OrderTimelineData{
 const w=order.work,reported=w?.legacy?.progress??order.data?.caseRecord?.progress??{},q=w?.quotes.at(-1),sampleOk=!!w&&confirmations.some(c=>approvalValid(c,w,'sample')),quoteOk=!!w&&confirmations.some(c=>approvalValid(c,w,'quote')||approvalValid(c,w,'change'));
 const production=w?.steps.filter(s=>s.kind==='bulk'||s.title.includes('印花'))??[],a=w?amounts(w,confirmations):null;
 const paid=!w?.paymentPlan||w.paymentPlan.mode==='single'?!!a?.confirmed&&a.outstanding===0:!!a&&w.paymentPlan.depositCents>0&&a.net>=w.paymentPlan.depositCents;
 const flags:Record<StageId,boolean>={budget:!!w||!!reported.budget,sample:!!w?.sample?.completed||!!reported.sample,school:!!w?.sample?.schoolDelivery&&sampleOk,quote:!!q&&q.specVersion===w?.spec.version,approval:quoteOk,bulk:paid,production:(production.length>0&&production.every(s=>s.status==='done'))||!!reported.production&&!!w&&['delivered','archived'].includes(w.business),delivery:!!w&&['delivered','archived'].includes(w.business)&&!!a?.confirmed&&a.outstanding===0};
 const details:Record<StageId,string>={
 budget:flags.budget?'需求已记录；未明确的信息可继续补充':'等待团队核对需求与预算',
 sample:flags.sample?reported.sample&&!w?.sample?.completed?'样衣已制作；实际完成日期待补充':'样衣已完成，打样费 ¥0':'免费打样，具体完成时间与团队沟通',
 school:sampleOk?(w?.sample?.schoolDelivery?'样衣已送校，客户已确认':'客户已确认，送校记录待补充'):(w?.sample?.schoolDelivery||reported.schoolDelivery?'已送校，等待样衣确认':'等待送校与样衣确认'),
 quote:flags.quote?'当前规格的最终报价已记录':'样衣确认后提供最终报价',
 approval:quoteOk?'客户已确认当前报价版本':'等待客户明确确认报价',
 bulk:paid?'约定付款节点已完成':reported.paymentNotStarted&&!a?.received?'付款尚未进行':flags.production?'制作完成，按本单约定付款':'制作完成后，按本单约定付款',
 production:flags.production?'制作及印花工序已完成':reported.production||production.some(s=>s.status==='doing')?'正在制作，具体工序由团队更新':'等待生产及印花安排',
 delivery:flags.delivery?'已交付，款项已结清':w?.business==='delivered'?'已交付，尾款仍待结清或核对':'等待交付与尾款核对',
 };
 const dates:Record<StageId,string|null>={budget:order.created_at?.slice(0,10)||null,sample:w?.sample?.completed??null,school:w?.sample?.schoolDelivery??null,quote:q?.at?.slice(0,10)??null,approval:confirmations.find(c=>!!w&&approvalValid(c,w,'quote'))?.response?.at.slice(0,10)??null,bulk:null,production:null,delivery:w?.logistics.find(l=>l.pickedUp)?.pickedUp??null};
 const recorded=new Set<StageId>(reported.preProductionComplete?['budget','sample','school','quote','approval']:[]);if(reported.sample&&!w?.sample?.completed)recorded.add('sample');
 if(recorded.has('school')&&!flags.school)details.school='历史流程已完成；送校日期及样衣确认凭证待补充';if(recorded.has('quote')&&!flags.quote)details.quote='历史流程已完成；最终报价单及金额待补充';if(recorded.has('approval')&&!flags.approval)details.approval='历史流程已完成；客户确认凭证待补充，不代建确认记录';
 if(reported.production&&w&&['delivered','archived'].includes(w.business))recorded.add('production');
 const currentId=reported.production&&!flags.production?'production':workflow.find(s=>!flags[s.id]&&!recorded.has(s.id))?.id;
 const current=workflow.find(s=>s.id===currentId)?.title??'已完成交付与结款';
 return {stages:workflow.map(s=>({...s,state:recorded.has(s.id)&&(s.id==='budget'?(!w||!!w.legacy):s.id==='sample'?!w?.sample?.completed:!flags[s.id])?'recorded':flags[s.id]?'done':s.id===currentId?'current':'pending',detail:details[s.id],date:reported.preProductionComplete&&recorded.has(s.id)?null:dates[s.id]})),current,completed:workflow.filter(s=>flags[s.id]||recorded.has(s.id)).length,total:workflow.length,updatedAt:w?.history.at(-1)?.at??order.created_at??null};
}
// Public projection: no order object, contact details, account IDs, ledger or costs.
export function publicOrderTimeline(order:ManagedOrder,confirmations:Confirmation[]){return orderTimeline(order,confirmations);}

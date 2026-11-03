'use client';

import {CalendarDays,Check,Clock3,FileImage,Hash,MessageCircle,Package,UserRound,Wallet,X} from 'lucide-react';
import {money,type ManagedOrder} from '@/lib/sewing/operations';
import {merchantProductLabel} from '@/lib/sewing/merchant-labels';
import {sizingSummary} from '@/lib/sewing/budget';
import {RequestDecision} from './OrderEditor';
import MerchantAttachment from './MerchantAttachment';

export default function MerchantRequest({order:o,canDecide,onReload}:{order:ManagedOrder;canDecide:boolean;onReload:()=>Promise<unknown>}) {
 const d=o.data,w=o.work;
 const status=!w?'pending':w.business==='cancelled'?'declined':'accepted';
 const StatusIcon=status==='pending'?Clock3:status==='accepted'?Check:X;
 const unitBudget=d?.unitBudgetCents??w?.unitBudgetCents;
 const totalBudget=d?.budgetCents??w?.budgetCents;
 const fabric=d?.fabric??w?.preferences?.fabric;
 const fabricDetails=d?.fabricDetails??w?.preferences?.fabricDetails;
 const files=o.requestFiles??[];
 const product=(d?.merchantTitle||w?.merchantTitle)?{title:d?.merchantTitle||w?.merchantTitle||'定制需求',original:d?.merchantSubtitle||w?.merchantSubtitle}:merchantProductLabel(w?.product||d?.product||'');
 return <article className="merchant-request ops-simple-request" data-status={status}>
  <header className="merchant-request-header">
   <div><h2>{product.title}</h2>{product.original&&<p className="merchant-product-original">{product.original}</p>}<p className="merchant-customer"><UserRound size={16} aria-hidden="true"/>{d?.name||w?.customer.name||'客户姓名待补充'}{(d?.group||w?.customer.organization)&&<span>· {d?.group||w?.customer.organization}</span>}</p></div>
   <span className="merchant-status ops-decision-status"><StatusIcon size={15} aria-hidden="true"/>{status==='pending'?'待决定':status==='accepted'?'已接单':'不接单'}</span>
  </header>
  <div className={"merchant-request-layout"+(files.length>1?" merchant-multiple-files":"")}>
   <section className="merchant-artwork" aria-label="设计与附件"><h3><FileImage size={17} aria-hidden="true"/>设计与附件 <span>{files.length} 份</span></h3>{files.length?<div className="merchant-files">{files.map((f,index)=><MerchantAttachment key={f.id} orderId={o.id} file={f} index={index}/>)}</div>:<div className="merchant-no-files"><FileImage size={32} strokeWidth={1.25} aria-hidden="true"/><p>客户未上传参考图</p><span>可在微信群补充设计</span></div>}</section>
   <div className="merchant-brief">
    <dl className="merchant-key-facts">
     <div><dt><Package size={16} aria-hidden="true"/>预计数量</dt><dd>{d?.quantity??w?.quantity??'待确认'}{(d?.quantity??w?.quantity)!=null&&<small> 件</small>}</dd></div>
     <div><dt><Wallet size={16} aria-hidden="true"/>{unitBudget!=null?'单件预算':totalBudget!=null?'整单预算':'单件预算'}</dt><dd>{unitBudget!=null?money(unitBudget):totalBudget!=null?money(totalBudget):'未填写'}</dd></div>
     <div><dt><CalendarDays size={16} aria-hidden="true"/>期望交付</dt><dd className="merchant-date">{d?.date||w?.expectedDate||'待沟通'}</dd></div>
    </dl>
    <p className="merchant-contact"><MessageCircle size={17} aria-hidden="true"/><span>微信</span><strong>{d?.wechat||w?.customer.contact||'未填写'}</strong></p>
    <dl className="merchant-details"><div><dt>面料</dt><dd>{fabric==='specified'?fabricDetails||'客户自行选择，细节待沟通':'由妈妈根据预算推荐'}</dd></div><div><dt>尺码</dt><dd>{sizingSummary(d?.sizing??w?.preferences?.sizing).replace(/^尺码：/,'')}</dd></div><div><dt>设计要求</dt><dd>{d?.requirements||w?.preferences?.requirements||'未填写'}</dd></div><div><dt>其他说明</dt><dd>{d?.notes||'未填写'}</dd></div></dl>
    {!!o.customerSupplements?.length&&<section className="merchant-supplements"><h3>客户补充</h3>{o.customerSupplements.map(n=><p key={n.id}>{n.notes||'补充了附件'}</p>)}</section>}
   </div>
  </div>
  <footer className="merchant-request-footer">{!w?canDecide?<RequestDecision order={o} onReload={onReload}/>:<p>等待妈妈决定是否接单。</p>:<p className="ops-decision-note"><StatusIcon size={18} aria-hidden="true"/>{status==='declined'?'不接单原因：'+(w.reason||'请在微信群沟通'):'已接单，面料、样衣、价格和交期请在微信群沟通。'}</p>}{o.timeline&&status!=='declined'&&<p className="merchant-progress-current">当前进度：<strong>{o.timeline.current}</strong></p>}<span className="merchant-reference"><Hash size={12} aria-hidden="true"/>{o.id.slice(0,8)}</span></footer>
 </article>;
}

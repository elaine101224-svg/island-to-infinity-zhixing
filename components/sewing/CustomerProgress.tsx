'use client';
import {useId} from 'react';
import {Check,Clock3,PackageCheck,Scissors} from 'lucide-react';
import type {OrderTimelineData} from '@/lib/sewing/timeline';
import './customer-progress.css';

export default function CustomerProgress({timeline,delivered=false,lang='en'}:{timeline:OrderTimelineData;delivered?:boolean;lang?:'en'|'zh'}){
 const headingId=useId();const t=(en:string,zh:string)=>lang==='zh'?zh:en;
 const current=timeline.stages.find(s=>s.state==='current');
 const StatusIcon=delivered?PackageCheck:current?.id==='production'?Scissors:Clock3;
 const title=delivered?t('Delivered','已交付'):current?.title||timeline.current;
 return <section className="customer-progress" aria-labelledby={headingId} data-delivered={delivered}>
  <header className="customer-progress-heading"><h2 id={headingId}>{t('Order progress','订单进度')}</h2><span>{t('Updated by the team','由团队更新')}</span></header>
  <div className="customer-progress-status" role="status"><span className="customer-progress-status-icon"><StatusIcon size={28} strokeWidth={1.5} aria-hidden="true"/></span><div><h3>{title}</h3><p>{delivered?t('Your order has been delivered. Thank you for making it with us.','本单已交付。'):current?.detail||t('The team will update your order here.','团队会在此更新订单进度。')}</p></div></div>
  <ol className="customer-progress-track" aria-label="Order stages">{timeline.stages.map((stage,index)=>{
   const state=delivered?(stage.id==='delivery'?'done':stage.state==='done'||stage.state==='recorded'?'recorded':'unrecorded'):stage.state;
   const label=delivered&&stage.id==='delivery'?t('Delivery','交付'):stage.title;
   const caption=state==='done'?t('Completed','已完成'):state==='recorded'?t('Recorded','团队已记录'):state==='current'?t('In progress','进行中'):state==='unrecorded'?t('Not recorded','未记录'):state==='review'?t('Needs review','待核对'):t('Upcoming','待进行');
   return <li key={stage.id} data-state={state} aria-current={state==='current'?'step':undefined}><span className="customer-progress-node" aria-hidden="true">{state==='done'||state==='recorded'?<Check size={18} strokeWidth={2}/>:state==='current'?<Clock3 size={18}/>:<span>{index+1}</span>}</span><div className="customer-progress-step"><strong>{label}</strong><span>{caption}</span>{stage.date&&!delivered&&<time dateTime={stage.date}>{stage.date}</time>}</div></li>;
  })}</ol>
  <p className="customer-progress-note">{delivered?t('Delivery is confirmed. Only recorded updates are shown above.','已确认交付；仅展示实际记录的进度。'):t('Updates appear here when recorded by the team.','团队更新后，客户会看到同一条进度。')}</p>
 </section>;
}

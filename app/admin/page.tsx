import Link from 'next/link';
import {ArrowRight, ChevronRight, CalendarDays, CircleCheck, Clock3} from 'lucide-react';
import {isDeepStrictEqual} from 'node:util';
import {getTeamMembers} from '@/lib/data';
import {supabase} from '@/lib/supabase';
import {readContentState} from '@/lib/websiteContent';
import {publicDocument,publicMembers,homepageSchema} from '@/lib/contentSchema';
import {withReviewedCalendar} from '@/lib/term/publication';
import {termSchema} from '@/lib/term/schema';
export const dynamic='force-dynamic';
export default async function Page(){
 const [term,content,members]=await Promise.all([supabase.from('term_workspaces').select('document').eq('id','2026-27-T1').single(),readContentState(),getTeamMembers()]);
 if(term.error)return <p role="alert">Today’s work could not be loaded. Please reload.</p>;
 const doc=termSchema.parse(term.data.document),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const week=new Date();week.setDate(week.getDate()+7);const until=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(week);
 const events=doc.events.filter(event=>(event.endDate??event.date)>=today&&event.date<=until&&event.status!=='Cancelled').sort((a,b)=>a.date.localeCompare(b.date));
 const tasks=doc.tasks.filter(task=>task.status!=='Completed'&&(task.status==='Blocked'||!!task.due&&task.due<today));
 const pending=doc.events.filter(event=>event.date>=today&&['Awaiting approval','Proposed','Tentative'].includes(event.status));
 const publicDraft=publicDocument(content.draft);let calendarChanged=false;try{calendarChanged=!isDeepStrictEqual(publicDraft.cards,withReviewedCalendar(publicDraft,doc.events).cards);}catch{calendarChanged=true;}
 const websiteChanged=!content.published||!isDeepStrictEqual({...publicDraft,members:publicMembers(members,content.draft.schoolYear)},homepageSchema.parse(content.published))||calendarChanged;
 const attention=[
  ...(tasks.length?[{href:'/admin/term#tasks',title:`${tasks.length} overdue or blocked tasks`,detail:'Review tasks',urgent:true}]:[]),
  ...(pending.length?[{href:'/admin/term#events',title:`${pending.length} plans awaiting confirmation`,detail:'Confirm semester plans',urgent:false}]:[]),
  ...(websiteChanged?[{href:'/admin/content',title:'Website changes to review',detail:'Review before publishing',urgent:false}]:[]),
 ];
 const dateLabel=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',weekday:'long',day:'numeric',month:'long'}).format(new Date());
 const focus='focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark';
 return <div className="max-w-6xl mx-auto space-y-7 text-earth-dark">
  <header className="flex flex-wrap items-center justify-between gap-4 border-b border-sand pb-6">
   <div><h1 className="text-2xl font-semibold tracking-tight">Today</h1><p className="mt-1 text-sm text-earth-mid">{dateLabel}</p></div>
   <Link href="/admin/term" className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-earth-dark px-4 py-2 text-sm font-medium text-white hover:bg-earth-mid transition-colors motion-reduce:transition-none ${focus}`}><CalendarDays size={16} aria-hidden="true"/>Open semester</Link>
  </header>
  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,1fr)]">
   <section className="min-w-0 rounded-xl border border-sand bg-white" aria-labelledby="week-heading">
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-sand"><div><h2 id="week-heading" className="text-base font-semibold">This week</h2><p className="text-xs text-earth-mid mt-1">Upcoming activities</p></div><CalendarDays className="text-earth-mid" size={18} aria-hidden="true"/></div>
    {events.length?<ul className="divide-y divide-sand">{events.map(event=>{
     const eventDate=new Date(`${event.date}T12:00:00+08:00`);
     const month=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',month:'short'}).format(eventDate);
     const day=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',day:'2-digit'}).format(eventDate);
     return <li key={event.id}><Link href="/admin/term#events" className={`group flex items-start gap-4 px-5 py-5 hover:bg-cream rounded-lg transition-colors motion-reduce:transition-none ${focus}`}>
      <time dateTime={event.date} className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-cream py-2 text-earth-mid"><span className="text-xs">{month}</span><span className="text-xl leading-7 font-semibold tabular-nums text-earth-dark">{day}</span></time>
      <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-6 break-words">{event.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-earth-mid"><Clock3 size={13} aria-hidden="true"/>{event.startTime||'Time TBC'}</p><span className={`mt-3 inline-block rounded-md px-2 py-1 text-xs ${event.status==='Confirmed'?'bg-sage-light/40 text-earth-dark':'bg-amber-light/60 text-earth-dark'}`}>{event.status}</span></div>
      <ChevronRight size={16} className="mt-2 shrink-0 text-earth-mid group-hover:text-earth-dark" aria-hidden="true"/>
     </Link></li>;
    })}</ul>:<div className="px-5 py-8"><p className="text-sm font-medium">No activities scheduled in the next seven days.</p><Link href="/admin/term" className={`inline-flex min-h-11 items-center gap-2 mt-2 text-sm text-earth-mid underline underline-offset-4 ${focus}`}>Plan an activity<ArrowRight size={14} aria-hidden="true"/></Link></div>}
   </section>
   <section className="min-w-0" aria-labelledby="attention-heading"><h2 id="attention-heading" className="text-base font-semibold mb-3">Needs attention</h2>
    {attention.length?<ul className="overflow-hidden rounded-xl border border-sand bg-white divide-y divide-sand">{attention.map(item=><li key={item.href}><Link href={item.href} className={`group flex min-h-20 items-center gap-3 p-4 hover:bg-cream transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-terracotta-dark`}><span className={`size-2 shrink-0 rounded-full ${item.urgent?'bg-terracotta-dark':'bg-amber-warm'}`} aria-hidden="true"/><span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-5">{item.title}</span><span className="block mt-1 text-xs text-earth-mid">{item.detail}</span></span><ChevronRight size={16} className="shrink-0 text-earth-mid" aria-hidden="true"/></Link></li>)}</ul>:<div className="flex gap-3 rounded-xl border border-sand bg-white p-5"><CircleCheck size={18} className="text-earth-mid shrink-0" aria-hidden="true"/><p className="text-sm">Nothing needs your attention right now.</p></div>}
   </section>
  </div>
 </div>;
}

import Link from 'next/link';
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
 return <div className="max-w-4xl mx-auto space-y-8"><header><h1 className="font-serif text-3xl">Today</h1><p className="text-earth-mid mt-2">{today} · Start with what needs attention.</p></header>
 {(tasks.length>0||pending.length>0||websiteChanged)&&<section className="space-y-3"><h2 className="text-xl font-semibold">Needs attention</h2><ul className="divide-y divide-sand border-y border-sand">{tasks.length>0&&<li><Link href="/admin/term#tasks" className="block py-4 underline">{tasks.length} overdue or blocked tasks</Link></li>}{pending.length>0&&<li><Link href="/admin/term#events" className="block py-4 underline">{pending.length} plans awaiting confirmation</Link></li>}{websiteChanged&&<li><Link href="/admin/content" className="block py-4 underline">Review website changes before publishing</Link></li>}</ul></section>}
 <section><div className="flex justify-between gap-4 mb-3"><h2 className="text-xl font-semibold">This week</h2><Link href="/admin/term" className="underline">Open semester</Link></div>{events.length?<ul className="divide-y divide-sand border-y border-sand">{events.map(event=><li key={event.id} className="py-4"><p className="font-medium">{event.title}</p><p className="text-sm text-earth-mid mt-1">{event.date} · {event.startTime||'Time TBC'} · {event.status}</p></li>)}</ul>:<p className="text-earth-mid">No activities scheduled in the next seven days.</p>}</section>
 <section className="flex flex-wrap gap-3 border-t border-sand pt-6"><Link className="editor-button" href="/admin/term">Manage semester</Link><Link className="min-h-11 px-4 py-3 underline" href="/admin/members">Members</Link><Link className="min-h-11 px-4 py-3 underline" href="/admin/content">Edit website</Link></section></div>;
}

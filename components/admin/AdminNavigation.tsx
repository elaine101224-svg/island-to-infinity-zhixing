'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useRef,useState} from 'react';
import {LayoutDashboard,ClipboardList,CalendarDays,Users,Globe,Scissors,ArrowUpRight,LogOut,Menu,X,ChevronRight} from 'lucide-react';
import Logo from '@/components/ui/Logo';

const work=[{href:'/admin',label:'Overview',icon:LayoutDashboard},{href:'/admin/tasks',label:'Member Tasks',icon:ClipboardList},{href:'/admin/term',label:'Calendar',icon:CalendarDays},{href:'/admin/members',label:'Members',icon:Users}];
const publish=[{href:'/admin/content',label:'Website',icon:Globe},{href:'/admin/sewing',label:'Sewing team',icon:Scissors}];
const more=[{href:'/admin/settings',label:'Workspace settings'},{href:'/admin/families',label:'Family records'},{href:'/admin/activities',label:'Activity records'},{href:'/admin/term/import',label:'Task import preview'},{href:'/admin/term/advanced',label:'Advanced semester'}];
export default function AdminNavigation(){
 const pathname=usePathname(),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),toggle=useRef<HTMLButtonElement>(null);
 const route=more.find(item=>pathname.startsWith(item.href))?.href??(pathname==='/admin/team'||pathname.startsWith('/admin/member-')?'/admin/members':pathname);
 function active(href:string){return route===href||(href!=='/admin'&&!more.some(item=>route===item.href)&&route.startsWith(href+'/'));}
 // A full navigation discards authenticated client state after logout.
 // eslint-disable-next-line @next/next/no-location-assign-relative-destination
 async function logout(){if(document.querySelector('[data-member-dirty]')&&!window.confirm('Sign out and discard your unsaved draft?'))return;setBusy(true);setError('');try{const response=await fetch('/api/admin/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw Error();window.location.assign('/login');}catch{setError('Could not sign out. Try again.');setBusy(false);}}
 return <aside className="admin-navigation" onKeyDown={event=>{if(event.key==='Escape'&&open){setOpen(false);toggle.current?.focus();}}}>
  <a href="#admin-main" className="sr-only focus:not-sr-only focus:block focus:p-4 focus:underline">Skip to main content</a>
  <div className="flex items-center justify-between gap-3 px-5 py-6"><Link href="/admin" className="flex items-center gap-3" onClick={()=>setOpen(false)}><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cream"><Logo size={34}/></span><span className="text-sm font-semibold leading-5">Island to Infinity<span className="block text-xs font-normal text-sand-dark mt-1">Admin workspace</span></span></Link><button ref={toggle} type="button" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="console-navigation" onClick={()=>setOpen(value=>!value)} className="md:hidden flex size-11 items-center justify-center rounded-lg hover:bg-white/10">{open?<X size={21}/>:<Menu size={21}/>}</button></div>
  <div id="console-navigation" className={`${open?'flex':'hidden'} md:flex flex-1 flex-col`}>
   <div className="mx-5 mb-5 flex items-center gap-2 border-y border-white/15 py-3 text-xs text-sand"><span className="size-1.5 rounded-full bg-sage-light" aria-hidden="true"/>Shared workspace <span className="text-sand-dark">/</span> All years</div>
   <nav aria-label="Admin navigation" className="px-3 space-y-5"><ul className="space-y-1">{work.map(item=><li key={item.href}><Link href={item.href} aria-current={active(item.href)?'page':undefined} className={`console-nav-link ${active(item.href)?'is-active':''}`} onClick={()=>setOpen(false)}><item.icon size={18} aria-hidden="true"/><span>{item.label}</span>{active(item.href)&&<ChevronRight size={14} className="ml-auto" aria-hidden="true"/>}</Link></li>)}</ul><ul className="space-y-1 border-t border-white/15 pt-4">{publish.map(item=><li key={item.href}><Link href={item.href} aria-current={active(item.href)?'page':undefined} className={`console-nav-link ${active(item.href)?'is-active':''}`} onClick={()=>setOpen(false)}><item.icon size={18} aria-hidden="true"/>{item.label}</Link></li>)}</ul><section className="text-sand-dark px-3" data-static-section="true"><div className="min-h-11 cursor-pointer py-3 text-xs" data-section-heading="true">More tools</div><ul className="space-y-1 pb-3">{more.map(item=><li key={item.href}><Link href={item.href} aria-current={route===item.href?'page':undefined} onClick={()=>setOpen(false)} className={`block rounded-md px-3 py-3 text-sm hover:bg-white/10 hover:text-cream ${route===item.href?'bg-white/10 text-cream':''}`}>{item.label}</Link></li>)}</ul></section></nav>
   <div className="mt-auto p-3 pt-8"><div className="border-t border-white/15 pt-3"><Link href="/" target="_blank" rel="noopener noreferrer" className="console-nav-link"><Globe size={17} aria-hidden="true"/>View website<ArrowUpRight size={14} className="ml-auto" aria-hidden="true"/><span className="sr-only">(opens in a new tab)</span></Link><button className="console-nav-link w-full text-left disabled:opacity-50" disabled={busy} onClick={()=>void logout()}><LogOut size={17} aria-hidden="true"/>{busy?'Signing out…':'Sign out'}</button>{error&&<p role="alert" className="px-3 text-sm text-cream">{error}</p>}</div></div>
  </div>
 </aside>;
}

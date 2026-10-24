'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Users, Calendar, LayoutDashboard, LogOut, ClipboardList, Globe, ArrowUpRight, Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const primary = [
 {href:'/admin',label:'Today',icon:LayoutDashboard},
 {href:'/admin/term',label:'Semester',icon:Calendar},
 {href:'/admin/members',label:'Members',icon:Users},
 {href:'/admin/content',label:'Website',icon:Globe},
];
const secondary = [
 {href:'/admin/sewing',label:'Sewing · 缝纫队',icon:ClipboardList},
];

export default function AdminSidebar({member=false,canEditRoster=false,canManage=false}:{member?:boolean;canEditRoster?:boolean;canManage?:boolean}) {
 const items=member?[{href:'/members',label:'Today',icon:LayoutDashboard},{href:'/members#calendar',label:'Semester',icon:Calendar},{href:'/members#tasks',label:'My tasks',icon:ClipboardList},{href:'/members/activities',label:'Activity log',icon:ClipboardList},...(canEditRoster?[{href:'/members/roster',label:'Members',icon:Users}]:[]),...(canManage?[{href:'/admin',label:'Manage workspace',icon:Globe}]:[])]:primary;
  const pathname = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/members/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Unable to log out. Please retry.');
      // Clear authenticated client state as well as cookies after signing out.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/members');
    } catch { setError('Unable to log out. Please retry.'); setBusy(false); }
  }

  return <aside className="w-full md:w-54 md:shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto bg-cream text-earth-dark border-b md:border-b-0 md:border-r border-sand" onKeyDown={event => {
    if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <a href="#admin-main" className="sr-only focus:not-sr-only focus:block focus:p-4 focus:underline">Skip to main content</a>
    <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-sand">
      <Link href={member?'/members':'/admin'} className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta-dark" onClick={() => setOpen(false)}>
        <div className="shrink-0"><Logo size={32} /></div>
        <div><span className="font-semibold text-sm">Island to Infinity</span><p className="text-xs text-earth-mid mt-0.5">{member?'Member workspace':'Admin workspace'}</p></div>
      </Link>
      <button ref={toggle} type="button" aria-label={open ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)} className="md:hidden flex size-11 items-center justify-center rounded-lg hover:bg-sand/50 focus-visible:outline-2 focus-visible:outline-terracotta-dark">{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
    <div id="admin-navigation" className={`${open ? 'flex' : 'hidden'} md:flex flex-col md:min-h-[calc(100dvh-81px)]`}>
      <nav aria-label="Admin navigation" className="p-3 space-y-3">
        <ul className="space-y-1">{items.map(item=>{const active=!item.href.includes('#')&&(pathname===item.href||(item.href!=='/admin'&&pathname.startsWith(item.href+'/'))||(item.href==='/admin/members'&&['/admin/team','/admin/member-access'].includes(pathname)));return <li key={item.href}><Link href={item.href} aria-current={active?'page':undefined} onClick={()=>setOpen(false)} className={`flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-dark ${active?'bg-sand/70 text-earth-dark':'text-earth-mid hover:text-earth-dark hover:bg-sand/50'}`}><item.icon size={18} aria-hidden="true"/>{item.label}</Link></li>;})}</ul>
        {!member&&<details className="border-t border-sand pt-3"><summary className="cursor-pointer min-h-11 px-3 py-3 text-sm text-earth-mid">More</summary><ul className="mt-1 space-y-1">{secondary.map(item=><li key={item.href}><Link href={item.href} onClick={()=>setOpen(false)} aria-current={pathname===item.href?'page':undefined} className="flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-earth-mid hover:bg-sand/50 focus-visible:outline-2 focus-visible:outline-terracotta-dark"><item.icon size={17} aria-hidden="true"/>{item.label}</Link></li>)}</ul></details>}
      </nav>
      <div className="p-3 mt-auto border-t border-sand space-y-1">
        <Link href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-earth-mid hover:bg-sand/50 focus-visible:outline-2 focus-visible:outline-terracotta-dark">View website <ArrowUpRight size={18} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></Link>
        <button type="button" disabled={busy} onClick={() => void handleLogout()} className="w-full flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-earth-mid hover:bg-sand/50 text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-terracotta-dark"><LogOut size={18} aria-hidden="true" />{busy ? 'Logging out…' : 'Log out'}</button>
        {error && <p role="alert" className="px-3 text-sm text-terracotta-dark">{error}</p>}
      </div>
    </div>
  </aside>;
}

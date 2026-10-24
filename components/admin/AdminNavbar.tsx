'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { UserCog, Users, Calendar, FileText, LayoutDashboard, LogOut, ClipboardList, Globe, ArrowUpRight, Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const groups = [
  { label: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Semester work', items: [
    { href: '/admin/term', label: 'Term 1 Workspace', icon: ClipboardList },
    { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
    { href: '/admin/families', label: 'Families', icon: Users },
    { href: '/admin/plans', label: 'Plans', icon: FileText },
  ] },
  { label: 'People & access', items: [
    { href: '/admin/team', label: 'Team', icon: Users },
    { href: '/admin/member-access', label: 'Member Access', icon: UserCog },
  ] },
  { label: 'Public website', items: [
    { href: '/admin/content', label: 'Website Content', icon: Globe },
    { href: '/admin/sewing', label: 'Sewing · 缝纫队', icon: ClipboardList },
  ] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Unable to log out. Please retry.');
      router.push('/login'); router.refresh();
    } catch { setError('Unable to log out. Please retry.'); setBusy(false); }
  }

  return <aside className="w-full md:w-60 md:shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto bg-earth-dark text-cream" onKeyDown={event => {
    if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <a href="#admin-main" className="sr-only focus:not-sr-only focus:block focus:p-4 focus:underline">Skip to main content</a>
    <div className="flex items-center justify-between gap-3 p-5 border-b border-cream/15">
      <Link href="/admin" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream" onClick={() => setOpen(false)}>
        <div className="bg-cream rounded-xl p-1.5"><Logo size={34} /></div>
        <div><span className="font-semibold text-base">Admin</span><p className="text-xs text-sand mt-0.5">Island to Infinity</p></div>
      </Link>
      <button ref={toggle} type="button" aria-label={open ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)} className="md:hidden flex size-11 items-center justify-center rounded-lg hover:bg-earth-mid focus-visible:outline-2 focus-visible:outline-cream">{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
    <div id="admin-navigation" className={`${open ? 'block' : 'hidden'} md:block`}>
      <nav aria-label="Admin navigation" className="p-3 space-y-5">
        {groups.map(group => <div key={group.label}>
          <p className="px-3 mb-1 text-xs font-medium text-sand">{group.label}</p>
          <ul className="space-y-0.5">{group.items.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
            return <li key={item.href}><Link href={item.href} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)} className={`flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream ${active ? 'bg-cream text-earth-dark' : 'text-sand hover:text-white hover:bg-earth-mid/50'}`}><item.icon size={18} aria-hidden="true" /><span>{item.label}</span></Link></li>;
          })}</ul>
        </div>)}
      </nav>
      <div className="p-3 mt-2 border-t border-cream/15 space-y-1">
        <Link href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-sand hover:bg-earth-mid/50 focus-visible:outline-2 focus-visible:outline-cream">View website <ArrowUpRight size={18} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></Link>
        <button type="button" disabled={busy} onClick={() => void handleLogout()} className="w-full flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-lg text-sand hover:bg-earth-mid/50 text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-cream"><LogOut size={18} aria-hidden="true" />{busy ? 'Logging out…' : 'Log out'}</button>
        {error && <p role="alert" className="px-3 text-sm text-cream">{error}</p>}
      </div>
    </div>
  </aside>;
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Users, Calendar, FileText, LayoutDashboard, LogOut, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/families', label: 'Families', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/plans', label: 'Plans', icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shadow-xl">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-2 rounded-xl shadow-lg shadow-rose-500/20">
            <span className="text-xl">🏝️</span>
          </div>
          <div>
            <span className="font-semibold text-base text-white">Admin</span>
            <p className="text-xs text-slate-400">Island to Infinity</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Exit Admin */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
        >
          <LogOut className="h-5 w-5 text-slate-400" />
          <span>Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}

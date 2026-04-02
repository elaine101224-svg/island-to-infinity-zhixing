'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Users, Calendar, FileText, LayoutDashboard, X } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/families', label: 'Families', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/plans', label: 'Plans', icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sand-50 text-sand-900 flex flex-col min-h-screen font-sans shadow-lg rounded-r-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-sand-200">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="bg-sand-200 p-2 rounded-lg shadow-sm">
            <span className="text-2xl">🏝️♾️</span>
          </div>
          <div>
            <span className="font-semibold text-lg text-sand-900">Admin</span>
            <p className="text-xs text-sand-700">Island to Infinity</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-all ${
                    isActive
                      ? 'bg-sand-300 text-sand-900 font-semibold shadow-md'
                      : 'bg-sand-100 text-sand-800 hover:bg-sand-200 hover:text-sand-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 text-sand-900" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Exit Admin */}
      <div className="p-4 border-t border-sand-200">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sand-100 text-sand-800 hover:bg-sand-200 hover:text-sand-900 shadow-sm transition-all"
        >
          <X className="h-5 w-5" />
          <span className="font-medium">Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}
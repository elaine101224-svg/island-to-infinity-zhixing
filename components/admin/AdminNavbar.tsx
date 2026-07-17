'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserCog, Users, Calendar, FileText, LayoutDashboard, LogOut, ClipboardList } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/team', label: 'Team', icon: UserCog },
  { href: '/admin/families', label: 'Families', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/activities', label: 'Activity Log', icon: ClipboardList },
  { href: '/admin/plans', label: 'Plans', icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-earth-dark text-white flex flex-col min-h-screen shadow-xl">
      {/* Logo */}
      <div className="p-5 border-b border-earth-mid/30">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="bg-cream rounded-xl p-1.5 shadow-lg">
            <Logo size={38} />
          </div>
          <div>
            <span className="font-semibold text-base text-white">Admin</span>
            <p className="text-xs text-amber-light/50">Island to Infinity</p>
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
                      ? 'bg-terracotta text-white shadow-lg shadow-terracotta/25'
                      : 'text-amber-light/60 hover:text-white hover:bg-earth-mid/50'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-amber-light/40'}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-earth-mid/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-amber-light/60 hover:text-white hover:bg-earth-mid/50 transition-all text-sm font-medium"
        >
          <LogOut className="h-5 w-5 text-amber-light/40" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
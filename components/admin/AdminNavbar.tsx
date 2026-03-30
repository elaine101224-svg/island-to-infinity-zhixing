'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, LogOut, Users, Calendar, FileText } from 'lucide-react';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: Heart },
  { href: '/admin/families', label: 'Families', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/plans', label: 'Plans', icon: FileText },
];

export default function AdminNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-400" />
              <span className="font-semibold">Admin Dashboard</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {adminLinks.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-800 px-4 py-2 flex gap-4 overflow-x-auto">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-300 hover:text-white transition-colors text-sm whitespace-nowrap flex items-center gap-1"
          >
            <link.icon className="h-3 w-3" />
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

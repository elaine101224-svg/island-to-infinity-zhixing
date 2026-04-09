import { getFamilies, getPlans, getScheduleEvents } from '@/lib/data';
import { Users, Calendar, FileText, Heart } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const families = await getFamilies();
  const plans = await getPlans();
  const events = await getScheduleEvents();

  const activePlans = plans.filter((p) => p.status === 'active').length;
  const publicEvents = events.filter((e) => e.isPublic).length;
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).length;

  const stats = [
    { label: 'Families', value: families.length, icon: Users, href: '/admin/families', color: 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' },
    { label: 'Active Plans', value: activePlans, icon: FileText, href: '/admin/plans', color: 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100' },
    { label: 'Upcoming Events', value: upcomingEvents, icon: Calendar, href: '/admin/schedule', color: 'bg-violet-50 border-violet-100 text-violet-600 hover:bg-violet-100' },
    { label: 'Public Events', value: publicEvents, icon: Heart, href: '/admin/schedule', color: 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2.5xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Welcome back. Here&apos;s an overview of your data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-xl border p-5 flex flex-col items-center justify-center transition-all hover:shadow-lg hover:-translate-y-0.5 ${stat.color}`}
          >
            <stat.icon className="h-7 w-7 mb-3 opacity-80" />
            <div className="text-2.5xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium mt-0.5 opacity-80">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/families"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <Users className="h-5 w-5 text-rose-500" />
          <span className="font-medium">Manage Families</span>
        </Link>
        <Link
          href="/admin/schedule"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <Calendar className="h-5 w-5 text-violet-500" />
          <span className="font-medium">Manage Schedule</span>
        </Link>
        <Link
          href="/admin/plans"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <FileText className="h-5 w-5 text-blue-500" />
          <span className="font-medium">Manage Plans</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Families</h2>
            <Link href="/admin/families" className="text-sm text-rose-500 hover:text-rose-600 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {families.slice(0, 5).map((family) => (
              <div key={family.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{family.pseudonym}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{family.location}</p>
                </div>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Events</h2>
            <Link href="/admin/schedule" className="text-sm text-violet-500 hover:text-violet-600 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {events.filter((e) => new Date(e.date) >= new Date()).slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{event.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.location}</p>
                </div>
                <span className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-full">{new Date(event.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

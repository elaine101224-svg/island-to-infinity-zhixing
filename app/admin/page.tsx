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
    { label: 'Families', value: families.length, icon: Users, href: '/admin/families', color: 'bg-rose-100 text-rose-700' },
    { label: 'Active Plans', value: activePlans, icon: FileText, href: '/admin/plans', color: 'bg-blue-100 text-blue-700' },
    { label: 'Upcoming Events', value: upcomingEvents, icon: Calendar, href: '/admin/schedule', color: 'bg-purple-100 text-purple-700' },
    { label: 'Public Events', value: publicEvents, icon: Heart, href: '/admin/schedule', color: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-sand-50 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-700 text-sm mt-1">
          Welcome back. Here's an overview of your data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-xl shadow-md p-6 flex flex-col items-center justify-center transition transform hover:scale-105 hover:shadow-lg ${stat.color}`}
          >
            <stat.icon className="h-8 w-8 mb-2" />
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/families"
          className="flex items-center gap-3 p-4 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
        >
          <Users className="h-5 w-5" />
          <span className="font-medium">Manage Families</span>
        </Link>
        <Link
          href="/admin/schedule"
          className="flex items-center gap-3 p-4 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
        >
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Manage Schedule</span>
        </Link>
        <Link
          href="/admin/plans"
          className="flex items-center gap-3 p-4 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        >
          <FileText className="h-5 w-5" />
          <span className="font-medium">Manage Plans</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sand-100 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Families</h2>
            <Link href="/admin/families" className="text-sm text-rose-700 hover:text-rose-900">View all</Link>
          </div>
          <div className="space-y-3">
            {families.slice(0, 5).map((family) => (
              <div key={family.id} className="flex items-center justify-between py-2 border-b border-sand-200 last:border-0">
                <div>
                  <p className="font-medium text-neutral-900">{family.pseudonym}</p>
                  <p className="text-sm text-neutral-700">{family.location}</p>
                </div>
                <span className="text-xs text-neutral-800">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sand-100 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Upcoming Events</h2>
            <Link href="/admin/schedule" className="text-sm text-purple-700 hover:text-purple-900">View all</Link>
          </div>
          <div className="space-y-3">
            {events.filter((e) => new Date(e.date) >= new Date()).slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-sand-200 last:border-0">
                <div>
                  <p className="font-medium text-neutral-900">{event.title}</p>
                  <p className="text-sm text-neutral-700">{event.location}</p>
                </div>
                <span className="text-xs text-purple-700">{new Date(event.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
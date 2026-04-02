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
  const upcomingEvents = events.filter(
    (e) => new Date(e.date) >= new Date()
  ).length;

  const stats = [
    {
      label: 'Families',
      value: families.length,
      icon: Users,
      href: '/admin/families',
      color: 'bg-neutral-100 text-primary-500',
    },
    {
      label: 'Active Plans',
      value: activePlans,
      icon: FileText,
      href: '/admin/plans',
      color: 'bg-neutral-100 text-primary-500',
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents,
      icon: Calendar,
      href: '/admin/schedule',
      color: 'bg-neutral-100 text-primary-500',
    },
    {
      label: 'Public Events',
      value: publicEvents,
      icon: Heart,
      href: '/admin/schedule',
      color: 'bg-neutral-100 text-primary-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-neutral-50 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Dashboard</h1>
        <p className="text-neutral-700 text-sm mt-1">
          Welcome back. Here&apos;s an overview of your data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-neutral-100 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary-700">{stat.value}</div>
            <div className="text-neutral-700 text-sm mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-neutral-100 rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/families"
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 transition-colors"
          >
            <Users className="h-5 w-5 text-primary-500" />
            <span className="font-medium text-neutral-700">Manage Families</span>
          </Link>
          <Link
            href="/admin/schedule"
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 transition-colors"
          >
            <Calendar className="h-5 w-5 text-primary-500" />
            <span className="font-medium text-neutral-700">Manage Schedule</span>
          </Link>
          <Link
            href="/admin/plans"
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 transition-colors"
          >
            <FileText className="h-5 w-5 text-primary-500" />
            <span className="font-medium text-neutral-700">Manage Plans</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Families */}
        <div className="bg-neutral-100 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-700">Families</h2>
            <Link
              href="/admin/families"
              className="text-sm text-primary-500 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {families.slice(0, 5).map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
              >
                <div>
                  <p className="font-medium text-primary-700">{family.pseudonym}</p>
                  <p className="text-sm text-neutral-700">{family.location}</p>
                </div>
                <span className="text-xs text-primary-500">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-neutral-100 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-700">Upcoming Events</h2>
            <Link
              href="/admin/schedule"
              className="text-sm text-primary-500 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {events
              .filter((e) => new Date(e.date) >= new Date())
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
                >
                  <div>
                    <p className="font-medium text-primary-700">{event.title}</p>
                    <p className="text-sm text-neutral-700">{event.location}</p>
                  </div>
                  <span className="text-xs text-primary-500">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
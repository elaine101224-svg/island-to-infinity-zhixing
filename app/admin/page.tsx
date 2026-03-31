import { getFamilies, getPlans, getScheduleEvents } from '@/lib/data';
import { Users, Calendar, FileText, Heart } from 'lucide-react';
import Link from 'next/link';

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
      color: 'bg-rose-100 text-rose-600',
    },
    {
      label: 'Active Plans',
      value: activePlans,
      icon: FileText,
      href: '/admin/plans',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents,
      icon: Calendar,
      href: '/admin/schedule',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Public Events',
      value: publicEvents,
      icon: Heart,
      href: '/admin/schedule',
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back. Here&apos;s an overview of your data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/families"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-colors"
          >
            <Users className="h-5 w-5 text-rose-500" />
            <span className="font-medium text-gray-700">Manage Families</span>
          </Link>
          <Link
            href="/admin/schedule"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-purple-500" />
            <span className="font-medium text-gray-700">Manage Schedule</span>
          </Link>
          <Link
            href="/admin/plans"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-gray-700">Manage Plans</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Families */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Families</h2>
            <Link
              href="/admin/families"
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {families.slice(0, 3).map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{family.pseudonym}</p>
                  <p className="text-sm text-gray-500">{family.location}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link
              href="/admin/schedule"
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {events
              .filter((e) => new Date(e.date) >= new Date())
              .slice(0, 3)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">{event.location}</p>
                  </div>
                  <span className="text-xs text-gray-400">
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
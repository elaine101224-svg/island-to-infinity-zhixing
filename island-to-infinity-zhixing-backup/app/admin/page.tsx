import Link from 'next/link';
import { getFamilies, getScheduleEvents, getPlans } from '@/lib/data';
import { Users, Calendar, FileText, ArrowRight } from 'lucide-react';

export default async function AdminDashboard() {
  const [families, events, plans] = await Promise.all([
    getFamilies(),
    getScheduleEvents(),
    getPlans(),
  ]);

  const activePlans = plans.filter(p => p.status === 'active');
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Families</p>
              <p className="text-3xl font-bold text-gray-900">{families.length}</p>
            </div>
            <div className="bg-rose-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Plans</p>
              <p className="text-3xl font-bold text-gray-900">{activePlans.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900">{upcomingEvents.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link href="/admin/schedule" className="text-rose-500 hover:text-rose-600 text-sm flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming events</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border-l-4 border-rose-300 pl-3 py-1">
                  <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.date} - {event.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/families"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Manage Families</p>
                <p className="text-xs text-gray-500">Add or edit family profiles</p>
              </div>
            </Link>
            <Link
              href="/admin/schedule"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Manage Schedule</p>
                <p className="text-xs text-gray-500">Add or edit events</p>
              </div>
            </Link>
            <Link
              href="/admin/plans"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Manage Plans</p>
                <p className="text-xs text-gray-500">Add or edit support plans</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Public View Link */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-gray-500 hover:text-rose-500 text-sm">
          View Public Website
        </Link>
      </div>
    </div>
  );
}

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
    { label: 'Families', value: families.length, icon: Users, href: '/admin/families', color: 'bg-terracotta/10 border-terracotta/20 text-terracotta-dark hover:bg-terracotta/20' },
    { label: 'Active Plans', value: activePlans, icon: FileText, href: '/admin/plans', color: 'bg-sage/10 border-sage/20 text-sage hover:bg-sage/20' },
    { label: 'Upcoming Events', value: upcomingEvents, icon: Calendar, href: '/admin/schedule', color: 'bg-amber-warm/10 border-amber-warm/20 text-amber-warm hover:bg-amber-warm/20' },
    { label: 'Public Events', value: publicEvents, icon: Heart, href: '/admin/schedule', color: 'bg-earth-mid/10 border-earth-mid/20 text-earth-mid hover:bg-earth-mid/20' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2.5xl font-bold text-earth-dark tracking-tight">Dashboard</h1>
        <p className="text-earth-mid text-sm mt-1.5">
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
          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-sand text-earth-dark hover:bg-cream/50 hover:border-terracotta/30 transition-all"
        >
          <Users className="h-5 w-5 text-terracotta" />
          <span className="font-medium">Manage Families</span>
        </Link>
        <Link
          href="/admin/schedule"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-sand text-earth-dark hover:bg-cream/50 hover:border-amber-warm/30 transition-all"
        >
          <Calendar className="h-5 w-5 text-amber-warm" />
          <span className="font-medium">Manage Schedule</span>
        </Link>
        <Link
          href="/admin/plans"
          className="flex items-center gap-3 p-4 rounded-xl bg-white border border-sand text-earth-dark hover:bg-cream/50 hover:border-sage/30 transition-all"
        >
          <FileText className="h-5 w-5 text-sage" />
          <span className="font-medium">Manage Plans</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-sand shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
            <h2 className="text-base font-semibold text-earth-dark">Families</h2>
            <Link href="/admin/families" className="text-sm text-terracotta hover:text-terracotta-dark font-medium">View all</Link>
          </div>
          <div className="divide-y divide-sand/60">
            {families.slice(0, 5).map((family) => (
              <div key={family.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-cream/50 transition-colors">
                <div>
                  <p className="font-medium text-earth-dark text-sm">{family.pseudonym}</p>
                  <p className="text-xs text-earth-mid mt-0.5">{family.location}</p>
                </div>
                <span className="text-xs text-earth-mid bg-sand/50 px-2 py-1 rounded-full">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-sand shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
            <h2 className="text-base font-semibold text-earth-dark">Upcoming Events</h2>
            <Link href="/admin/schedule" className="text-sm text-amber-warm hover:text-amber-warm/80 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-sand/60">
            {events.filter((e) => new Date(e.date) >= new Date()).slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-cream/50 transition-colors">
                <div>
                  <p className="font-medium text-earth-dark text-sm">{event.title}</p>
                  <p className="text-xs text-earth-mid mt-0.5">{event.location}</p>
                </div>
                <span className="text-xs text-amber-warm bg-amber-warm/10 px-2 py-1 rounded-full">{new Date(event.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

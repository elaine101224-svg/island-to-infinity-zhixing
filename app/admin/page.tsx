import { getFamilies, getPlans, getScheduleEvents, getTeamMembers, getActivityRecords } from '@/lib/data';
import { Users, Calendar, FileText, UserCog, Clock, ClipboardList, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const typeEmoji: Record<string, string> = {
  field_trip: '🏝️',
  visit: '🫂',
  event: '🎉',
  meeting: '📋',
};

export default async function AdminDashboardPage() {
  const [families, plans, events, members, activities] = await Promise.all([
    getFamilies(),
    getPlans(),
    getScheduleEvents(),
    getTeamMembers(),
    getActivityRecords(),
  ]);

  const activePlans = plans.filter((p) => p.status === 'active').length;
  const activeMembers = members.filter((m) => m.status === 'active').length;

  // ---- Reminders (computed) ----
  const todayStr = new Date().toISOString().split('T')[0];
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().split('T')[0];

  const upcoming = events
    .filter((e) => e.date >= todayStr && e.date <= in7Str)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const recordedEventIds = new Set(activities.map((a) => a.eventId).filter(Boolean));
  const needsRecording = events
    .filter((e) => e.date < todayStr && !recordedEventIds.has(e.id))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  const stats = [
    { label: 'Team Members', value: activeMembers, icon: UserCog, href: '/admin/team', color: 'bg-terracotta/10 border-terracotta/20 text-terracotta-dark hover:bg-terracotta/20' },
    { label: 'Families', value: families.length, icon: Users, href: '/admin/families', color: 'bg-sage/10 border-sage/20 text-sage hover:bg-sage/20' },
    { label: 'Active Plans', value: activePlans, icon: FileText, href: '/admin/plans', color: 'bg-amber-warm/10 border-amber-warm/20 text-amber-warm hover:bg-amber-warm/20' },
    { label: 'Sessions Logged', value: activities.length, icon: ClipboardList, href: '/admin/activities', color: 'bg-earth-mid/10 border-earth-mid/20 text-earth-mid hover:bg-earth-mid/20' },
  ];

  const familyName = (id: string) => families.find((f) => f.id === id)?.pseudonym;

  const dayLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto py-2">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-earth-dark tracking-tight">Dashboard</h1>
        <p className="text-earth-mid text-sm mt-1.5">Welcome back. Here&apos;s what needs your attention.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-xl border p-5 flex flex-col items-center justify-center transition-all hover:shadow-lg hover:-translate-y-0.5 ${stat.color}`}
          >
            <stat.icon className="h-7 w-7 mb-3 opacity-80" />
            <div className="text-3xl font-serif font-bold">{stat.value}</div>
            <div className="text-sm font-medium mt-0.5 opacity-80">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-sand shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-terracotta" />
              <h2 className="text-base font-semibold text-earth-dark">Upcoming this week</h2>
            </div>
            <Link href="/admin/schedule" className="text-sm text-terracotta hover:text-terracotta-dark font-medium">Schedule</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-5 py-8 text-sm text-earth-light text-center">Nothing scheduled in the next 7 days.</p>
          ) : (
            <div className="divide-y divide-sand/60">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium text-earth-dark text-sm truncate">
                      <span className="mr-1.5">{typeEmoji[e.type] || '📅'}</span>{e.title}
                    </p>
                    <p className="text-xs text-earth-mid mt-0.5">
                      {e.startTime && `${e.startTime} · `}{e.location || 'No location'}
                      {e.familiesInvolved?.length ? ` · ${e.familiesInvolved.map(familyName).filter(Boolean).join(', ')}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${e.date === todayStr ? 'bg-terracotta text-white' : 'bg-terracotta/10 text-terracotta-dark'}`}>
                    {dayLabel(e.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Needs recording */}
        <div className="bg-white rounded-xl border border-sand shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-warm" />
              <h2 className="text-base font-semibold text-earth-dark">Needs recording</h2>
            </div>
            <Link href="/admin/activities" className="text-sm text-amber-warm hover:text-amber-warm/80 font-medium">Activity Log</Link>
          </div>
          {needsRecording.length === 0 ? (
            <p className="px-5 py-8 text-sm text-earth-light text-center">All past events have been recorded. 🎉</p>
          ) : (
            <div className="divide-y divide-sand/60">
              {needsRecording.map((e) => (
                <Link
                  key={e.id}
                  href="/admin/activities"
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-cream/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-earth-dark text-sm truncate">
                      <span className="mr-1.5">{typeEmoji[e.type] || '📅'}</span>{e.title}
                    </p>
                    <p className="text-xs text-earth-mid mt-0.5">{new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-amber-warm font-medium flex items-center gap-1 flex-shrink-0 ml-3">
                    Record <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

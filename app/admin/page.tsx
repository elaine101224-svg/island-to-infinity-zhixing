import { parseISO } from 'date-fns';
import { getFamilies, getPlans, getScheduleEvents, getTeamMembers, getActivityRecords } from '@/lib/data';
import { Clock, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { readContentState } from '@/lib/websiteContent';
import { inSchoolYear, needsRecording as eventNeedsRecording } from '@/lib/schoolYear';

export const dynamic = 'force-dynamic';

const typeEmoji: Record<string, string> = {
  field_trip: '🏝️',
  visit: '🫂',
  event: '🎉',
  meeting: '📋',
};

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ history?: string }> }) {
  const [{ draft }, filters] = await Promise.all([readContentState(), searchParams]);
  const schoolYear = draft.schoolYear;
  const showHistory = filters.history === '1';
  const [families, plans, events, members, activities] = await Promise.all([
    getFamilies(),
    getPlans(),
    getScheduleEvents(),
    getTeamMembers(),
    getActivityRecords(),
  ]);

  const activePlans = plans.filter((p) => p.status === 'active').length;
  const unassignedMembers = members.filter(m => !m.academicYears?.length).length;
  const activeMembers = members.filter((m) => m.status === 'active' && m.academicYears?.includes(schoolYear)).length;

  // ---- Reminders (computed) ----
  const todayStr = new Date().toISOString().split('T')[0];
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().split('T')[0];

  const upcoming = events
    .filter((e) => e.date >= todayStr && e.date <= in7Str && e.status !== 'cancelled')
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const recordedEventIds = new Set(activities.map((a) => a.eventId).filter(Boolean));
  const needsRecording = events
    .filter((e) => eventNeedsRecording(e, recordedEventIds as Set<string>, schoolYear, todayStr, showHistory))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  const stats = [
    { label: `Confirmed active members · ${schoolYear}`, value: unassignedMembers && !activeMembers ? '—' : activeMembers, href: '/admin/team' },
    { label: 'Families', value: families.length, href: '/admin/families' },
    { label: 'Active Plans · all years', value: activePlans, href: '/admin/plans' },
    { label: `Recorded sessions · ${schoolYear}`, value: activities.filter(a => inSchoolYear(a.date, schoolYear) && a.date <= todayStr).length, href: '/admin/activities' },
  ];

  const familyName = (id: string) => families.find((f) => f.id === id)?.pseudonym;

  const dayLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const d = parseISO(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto py-2">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-earth-dark tracking-tight">Dashboard</h1>
        <p className="text-earth-mid text-sm mt-1.5">Welcome back. Here&apos;s what needs your attention.</p>
      </div>

      {unassignedMembers > 0 && <p className="mb-6 bg-amber-light/30 border border-sand rounded-xl p-4 text-earth-mid">{unassignedMembers} members have no confirmed school year. <Link href="/admin/team" className="underline">Review the roster</Link> before treating this year’s count as complete.</p>}
      <section aria-labelledby="admin-actions-title" className="mb-8">
        <h2 id="admin-actions-title" className="text-lg font-semibold mb-3">What would you like to do?</h2>
        <div className="divide-y divide-sand border-y border-sand">
          {[
            { href: '/admin/content', label: 'Edit website & photos', description: 'Homepage, Our Journey, documentary and public updates' },
            { href: '/admin/term', label: 'Manage semester work', description: 'Calendar, family groups, assignments and progress' },
            { href: '/admin/activities', label: 'Record an activity', description: 'Visits, session notes and follow-up' },
          ].map(action => <Link key={action.href} href={action.href} className="flex items-center justify-between gap-4 py-4 px-2 rounded-lg hover:bg-white focus-visible:outline-2 focus-visible:outline-terracotta-dark">
            <div><span className="font-medium text-earth-dark">{action.label}</span><p className="text-sm text-earth-mid mt-1">{action.description}</p></div><ArrowRight size={20} aria-hidden="true" className="shrink-0 text-earth-mid" />
          </Link>)}
        </div>
      </section>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-8">
        {stats.map(stat => <div key={stat.label}><dt className="text-sm text-earth-mid">{stat.label}</dt><dd className="mt-1"><Link href={stat.href} className="text-xl font-semibold tabular-nums underline decoration-sand underline-offset-4 hover:decoration-earth-mid focus-visible:outline-2 focus-visible:outline-terracotta-dark">{stat.value}</Link></dd></div>)}
      </dl>

      {/* Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-sand overflow-hidden">
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
        <div className="bg-white rounded-xl border border-sand overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-warm" />
              <h2 className="text-base font-semibold text-earth-dark">Needs recording · {showHistory ? "all years" : schoolYear}</h2>
            </div>
            <Link href={showHistory ? "/admin" : "/admin?history=1"} className="text-sm text-amber-warm hover:text-amber-warm/80 font-medium">{showHistory ? "Current year" : "View history"}</Link>
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
                    <p className="text-xs text-earth-mid mt-0.5">{parseISO(e.date).toLocaleDateString()}</p>
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

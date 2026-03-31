import { getPlans, getFamilies, getPublicEvents } from '@/lib/data';
import PlanCard from '@/components/plans/PlanCard';
import { Brain, HandHeart, Users, Target, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default async function PlansPage() {
  const plans = await getPlans();
  const families = await getFamilies();
  const publicEvents = await getPublicEvents();

  const familyMap = new Map(families.map(f => [f.id, f.pseudonym]));

  const plansWithFamilies = plans.map(plan => ({
    ...plan,
    familyPseudonym: familyMap.get(plan.familyId) || 'Unknown Family',
  }));

  const upcomingEvents = [...publicEvents]
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Support Plans
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our structured support plans are designed with ethical considerations
          and a focus on empowerment. Each plan addresses specific needs while
          respecting family dignity.
        </p>
      </div>

      {/* Focus Areas Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <span className="text-sm text-gray-600">Mental Health</span>
        </div>
        <div className="flex items-center gap-2">
          <HandHeart className="h-5 w-5 text-rose-500" />
          <span className="text-sm text-gray-600">Companionship</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">Social Integration</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plansWithFamilies.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            familyPseudonym={plan.familyPseudonym}
          />
        ))}
      </div>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-ocean-500" />
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Activities</h2>
          </div>
          <p className="text-center text-gray-600 mb-6">
            Join us at our upcoming public events
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gradient-to-br from-ocean-50 to-coral-50 rounded-xl p-5 border border-ocean-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">
                    {event.type === 'field_trip' ? '🏝️' :
                     event.type === 'visit' ? '🫂' :
                     event.type === 'event' ? '🎉' : '📋'}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-ocean-100 text-ocean-700 rounded-full">
                    {event.type.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>🌴</span>
                    <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{event.location}</span>
                  </div>
                </div>
                {event.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <a
              href="/schedule"
              className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-medium"
            >
              View full calendar
              <Calendar className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Ethical Approach */}
      <div className="mt-12 bg-gray-50 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Our Ethical Approach
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="text-2xl">🛡️</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Privacy First</h3>
              <p className="text-sm text-gray-600">
                All plans use anonymized data and pseudonyms. No sensitive personal
                information is ever shared publicly.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-2xl">✊</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Empowerment Focus</h3>
              <p className="text-sm text-gray-600">
                We support families to build their own strengths, never creating
                dependency on our services.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-2xl">🤝</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Respect Autonomy</h3>
              <p className="text-sm text-gray-600">
                Families participate voluntarily and are involved in decisions
                about their own support plans.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-2xl">📋</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Clear Communication</h3>
              <p className="text-sm text-gray-600">
                All activities and objectives are clearly explained with
                measurable indicators of success.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

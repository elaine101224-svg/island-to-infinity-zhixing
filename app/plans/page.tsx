import { getPlans, getFamilies } from '@/lib/data';
import PlanCard from '@/components/plans/PlanCard';
import { Brain, HandHeart, Users, Target } from 'lucide-react';

export default async function PlansPage() {
  const plans = await getPlans();
  const families = await getFamilies();

  const familyMap = new Map(families.map(f => [f.id, f.pseudonym]));

  const plansWithFamilies = plans.map(plan => ({
    ...plan,
    familyPseudonym: familyMap.get(plan.familyId) || 'Unknown Family',
  }));

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

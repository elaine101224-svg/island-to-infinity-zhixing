import { getPlans, getFamilies } from '@/lib/data';
import { FileText, ArrowRight, Check, X } from 'lucide-react';
import Link from 'next/link';

const focusAreaLabels = {
  mental_health: 'Mental Health',
  companionship: 'Companionship',
  social_integration: 'Social Integration',
};

const focusAreaColors = {
  mental_health: 'bg-purple-100 text-purple-700',
  companionship: 'bg-rose-100 text-rose-700',
  social_integration: 'bg-blue-100 text-blue-700',
};

const statusLabels = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
};

const statusColors = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  on_hold: 'bg-amber-100 text-amber-700',
};

export default async function AdminPlansPage() {
  const plans = await getPlans();
  const families = await getFamilies();

  const familyMap = new Map(families.map(f => [f.id, f.pseudonym]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Plans</h1>
          <p className="text-gray-500 text-sm mt-1">Manage family support plans</p>
        </div>
        <button className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors text-sm">
          Add Plan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Family
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Focus Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan) => {
              const achievedObjectives = plan.objectives.filter(o => o.status === 'achieved').length;
              const totalObjectives = plan.objectives.length;

              return (
                <tr key={plan.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{plan.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {familyMap.get(plan.familyId) || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${focusAreaColors[plan.focusArea]}`}>
                      {focusAreaLabels[plan.focusArea]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[plan.status]}`}>
                      {statusLabels[plan.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${(achievedObjectives / totalObjectives) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {achievedObjectives}/{totalObjectives}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-center">
        <Link href="/plans" className="text-gray-500 hover:text-rose-500 text-sm">
          View Public Plans Page
        </Link>
      </div>
    </div>
  );
}

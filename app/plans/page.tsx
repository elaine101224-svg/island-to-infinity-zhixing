import { getPlans } from '@/lib/data';
import { FileText } from 'lucide-react';
import type { SupportPlan } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-yellow-50">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-200 p-3 rounded-full shadow-md">
            <FileText className="h-8 w-8 text-yellow-700" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-yellow-900 mb-3">
          Support Plans
        </h1>
        <p className="text-yellow-800 max-w-2xl mx-auto">
          Explore the tailored support plans we provide for each family.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-yellow-100 border rounded-xl shadow-md p-4">
            <h2 className="font-semibold text-lg text-yellow-900 mb-2">{plan.title}</h2>
            <p className="text-sm text-yellow-800">
              {plan.focusArea ? `Focus: ${plan.focusArea}` : 'No focus area specified'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
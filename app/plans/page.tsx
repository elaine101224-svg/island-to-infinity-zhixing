import { getPlans } from '@/lib/data';
import { FileText } from 'lucide-react';
import type { SupportPlan } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Support Plans
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="border p-4 rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-2">{plan.title}</h2>
            <p className="text-sm text-gray-700">{plan.description || ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
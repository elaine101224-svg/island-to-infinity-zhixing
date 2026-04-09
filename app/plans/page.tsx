import { FileText } from 'lucide-react';
import type { SupportPlan } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/plans`);
  const plans: SupportPlan[] = await res.json();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-200 p-3 rounded-full shadow-md">
            <FileText className="h-8 w-8 text-yellow-700" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-3 tracking-wide">
          Support Plans
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Explore the tailored support plans we provide for each family.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-all">
            <h2 className="font-serif font-semibold text-lg text-slate-900 mb-2 tracking-wide">{plan.title}</h2>
            <p className="text-sm text-slate-500">
              {plan.focusArea ? `Focus: ${plan.focusArea}` : 'No focus area specified'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
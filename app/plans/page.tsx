import { FileText } from 'lucide-react';
import type { SupportPlan } from '@/types';
import PlanCard from '@/components/plans/PlanCard';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/plans`);
  const plans: SupportPlan[] = await res.json();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-light/30 p-3 rounded-full shadow-sm border border-sand">
            <FileText className="h-8 w-8 text-amber-warm" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold text-earth-dark mb-3 tracking-wide">
          Support Plans
        </h1>
        <p className="text-earth-mid max-w-2xl mx-auto">
          Explore the tailored support plans we provide for each family.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
import { FileText } from 'lucide-react';
import { getPlans } from '@/lib/data';
import PlanCard from '@/components/plans/PlanCard';
import Reveal from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Reveal className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-light/30 p-3 shadow-sm border border-sand">
            <FileText className="h-8 w-8 text-amber-warm" />
          </div>
        </div>
        <h1 className="heading-display text-3xl font-semibold text-earth-dark mb-3">
          Support Plans
        </h1>
        <p className="text-earth-mid max-w-2xl mx-auto">
          Explore the tailored support plans we provide for each family.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 90}>
            <PlanCard plan={plan} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

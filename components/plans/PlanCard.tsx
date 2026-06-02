import Link from 'next/link';
import { Brain, HandHeart, Users } from 'lucide-react';
import type { SupportPlan } from '@/types';

interface PlanCardProps {
  plan: SupportPlan;
  familyPseudonym?: string;
}

const focusAreaConfig = {
  social: {
    label: 'Social',
    color: 'bg-sage/10 text-sage border-sage/20',
    icon: Users,
  },
  financial: {
    label: 'Financial',
    color: 'bg-terracotta/10 text-terracotta border-terracotta/20',
    icon: Brain,
  },
  academic: {
    label: 'Academic',
    color: 'bg-amber-warm/10 text-amber-warm border-amber-warm/20',
    icon: HandHeart,
  },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-sage/10 text-sage' },
  completed: { label: 'Completed', color: 'bg-sand text-earth-mid' },
  on_hold: { label: 'On Hold', color: 'bg-amber-light/40 text-amber-warm' },
};

export default function PlanCard({ plan, familyPseudonym }: PlanCardProps) {
  const focusConfig = focusAreaConfig[plan.focusArea] || focusAreaConfig.social;
  const status = statusConfig[plan.status] || statusConfig.active;
  const FocusIcon = focusConfig.icon;
  const achievedCount = plan.objectives?.filter(o => o.status === 'achieved').length || 0;
  const totalCount = plan.objectives?.length || 0;
  const progressPercent = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

  return (
    <Link href={`/plans`}>
      <div className="bg-white border border-sand rounded-2xl p-5 hover:shadow-lg hover:border-sand-dark transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${focusConfig.color.split(' ')[0]}`}>
              <FocusIcon className="h-4 w-4 text-current" />
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${focusConfig.color}`}>
              {focusConfig.label}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <h3 className="font-serif font-semibold text-earth-dark mb-1.5 line-clamp-1 tracking-wide">
          {plan.title}
        </h3>

        {familyPseudonym && (
          <p className="text-sm text-earth-mid mb-3">{familyPseudonym}</p>
        )}

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-earth-mid mb-1.5">
            <span>Progress</span>
            <span className="font-medium text-earth-dark">
              {achievedCount} / {totalCount}
            </span>
          </div>
          <div className="h-2 bg-sand rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-terracotta to-terracotta-dark rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

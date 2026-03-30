import Link from 'next/link';
import { Brain, HandHeart, Users } from 'lucide-react';
import type { SupportPlan } from '@/types';

interface PlanCardProps {
  plan: SupportPlan;
  familyPseudonym?: string;
}

const focusAreaConfig = {
  mental_health: {
    label: 'Mental Health',
    color: 'bg-purple-100 text-purple-700',
    icon: Brain,
  },
  companionship: {
    label: 'Companionship',
    color: 'bg-rose-100 text-rose-700',
    icon: HandHeart,
  },
  social_integration: {
    label: 'Social Integration',
    color: 'bg-blue-100 text-blue-700',
    icon: Users,
  },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700' },
  on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700' },
};

export default function PlanCard({ plan, familyPseudonym }: PlanCardProps) {
  const focusConfig = focusAreaConfig[plan.focusArea];
  const status = statusConfig[plan.status];
  const FocusIcon = focusConfig.icon;

  return (
    <Link href={`/plans`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <FocusIcon className="h-5 w-5 text-gray-400" />
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${focusConfig.color}`}>
              {focusConfig.label}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
          {plan.title}
        </h3>

        {familyPseudonym && (
          <p className="text-sm text-gray-500 mb-2">{familyPseudonym}</p>
        )}

        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {plan.objectives.filter(o => o.status === 'achieved').length} / {plan.objectives.length}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all"
              style={{
                width: `${(plan.objectives.filter(o => o.status === 'achieved').length / plan.objectives.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

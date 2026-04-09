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
    color: 'bg-purple-50 text-purple-700 border-purple-100',
    icon: Brain,
  },
  companionship: {
    label: 'Companionship',
    color: 'bg-rose-50 text-rose-700 border-rose-100',
    icon: HandHeart,
  },
  social_integration: {
    label: 'Social Integration',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: Users,
  },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600' },
  on_hold: { label: 'On Hold', color: 'bg-amber-50 text-amber-700' },
};

export default function PlanCard({ plan, familyPseudonym }: PlanCardProps) {
  const focusConfig = focusAreaConfig[plan.focusArea];
  const status = statusConfig[plan.status];
  const FocusIcon = focusConfig.icon;
  const achievedCount = plan.objectives.filter(o => o.status === 'achieved').length;
  const totalCount = plan.objectives.length;
  const progressPercent = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

  return (
    <Link href={`/plans`}>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
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

        <h3 className="font-semibold text-slate-900 mb-1.5 line-clamp-1">
          {plan.title}
        </h3>

        {familyPseudonym && (
          <p className="text-sm text-slate-500 mb-3">{familyPseudonym}</p>
        )}

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress</span>
            <span className="font-medium text-slate-700">
              {achievedCount} / {totalCount}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

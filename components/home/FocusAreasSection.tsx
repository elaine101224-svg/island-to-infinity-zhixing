import { Brain, HandHeart, Users } from 'lucide-react';

const focusAreas = [
  {
    icon: Brain,
    title: 'Mental Health Support',
    description:
      'We provide emotional support and resources for families dealing with stress, grief, anxiety, and other mental health challenges. Our approach is warm, non-judgmental, and focused on building resilience.',
    color: 'bg-gradient-to-br from-purple-50 to-white border-purple-100',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-100/70',
  },
  {
    icon: HandHeart,
    title: 'Companionship',
    description:
      'Loneliness can affect anyone, but it particularly impacts elderly people and those isolated due to circumstance. We regular visits, conversation, and shared activities to combat isolation.',
    color: 'bg-gradient-to-br from-rose-50 to-white border-rose-100',
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-100/70',
  },
  {
    icon: Users,
    title: 'Social Integration',
    description:
      'For families who are new to an area or feel disconnected from their community, we help bridge that gap. We facilitate connections, organize group activities, and support children in school.',
    color: 'bg-gradient-to-br from-blue-50 to-white border-blue-100',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-100/70',
  },
];

export default function FocusAreasSection() {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-10 text-center tracking-wide">
          Our Focus Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {focusAreas.map((area) => (
            <div
              key={area.title}
              className={`${area.color} border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="flex items-center justify-center mb-4">
                <div className={`${area.iconBg} p-3.5 rounded-xl`}>
                  <area.icon className={`h-6 w-6 ${area.iconColor}`} />
                </div>
              </div>
              <h3 className="text-base font-serif font-semibold text-slate-900 mb-2.5 text-center tracking-wide">
                {area.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

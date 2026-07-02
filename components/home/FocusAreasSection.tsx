import { Brain, HandHeart, Users } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';

const focusAreas = [
  {
    icon: Brain,
    title: 'Mental Health Support',
    description:
      'We provide emotional support and resources for families dealing with stress, grief, anxiety, and other mental health challenges. Our approach is warm, non-judgmental, and focused on building resilience.',
    color: 'bg-gradient-to-br from-white to-sage-light/20 border-sand',
    iconColor: 'text-sage',
    iconBg: 'bg-sage-light/50',
  },
  {
    icon: HandHeart,
    title: 'Companionship',
    description:
      'Loneliness can affect anyone, but it particularly impacts elderly people and those isolated due to circumstance. We regular visits, conversation, and shared activities to combat isolation.',
    color: 'bg-gradient-to-br from-white to-terracotta-light/20 border-sand',
    iconColor: 'text-terracotta',
    iconBg: 'bg-terracotta-light/50',
  },
  {
    icon: Users,
    title: 'Social Integration',
    description:
      'For families who are new to an area or feel disconnected from their community, we help bridge that gap. We facilitate connections, organize group activities, and support children in school.',
    color: 'bg-gradient-to-br from-white to-amber-light/40 border-sand',
    iconColor: 'text-amber-warm',
    iconBg: 'bg-amber-light/60',
  },
];

export default function FocusAreasSection() {
  return (
    <section className="py-12 sm:py-16 bg-cream/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="heading-display text-2xl sm:text-3xl font-semibold text-earth-dark mb-10 text-center">
          Our Focus Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {focusAreas.map((area, i) => (
            <Reveal
              key={area.title}
              delay={i * 120}
              className={`${area.color} border rounded-sm p-6 hover:shadow-lg transition-shadow duration-300`}
            >
              <div className="flex items-center justify-center mb-4">
                <div className={`${area.iconBg} p-3.5`}>
                  <area.icon className={`h-6 w-6 ${area.iconColor}`} />
                </div>
              </div>
              <h3 className="heading-display text-base font-medium text-earth-dark mb-2.5 text-center">
                {area.title}
              </h3>
              <p className="text-earth-mid text-sm leading-relaxed">
                {area.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

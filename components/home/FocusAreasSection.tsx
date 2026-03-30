import { Brain, HandHeart, Users } from 'lucide-react';

const focusAreas = [
  {
    icon: Brain,
    title: 'Mental Health Support',
    description:
      'We provide emotional support and resources for families dealing with stress, grief, anxiety, and other mental health challenges. Our approach is warm, non-judgmental, and focused on building resilience.',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-500',
  },
  {
    icon: HandHeart,
    title: 'Companionship',
    description:
      'Loneliness can affect anyone, but it particularly impacts elderly people and those isolated due to circumstance. We regular visits, conversation, and shared activities to combat isolation.',
    color: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-500',
  },
  {
    icon: Users,
    title: 'Social Integration',
    description:
      'For families who are new to an area or feel disconnected from their community, we help bridge that gap. We facilitate connections, organize group activities, and support children in school.',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-500',
  },
];

export default function FocusAreasSection() {
  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
          Our Focus Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {focusAreas.map((area) => (
            <div
              key={area.title}
              className={`${area.color} border rounded-xl p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-center mb-4">
                <div className={`p-3 rounded-full bg-white ${area.iconColor}`}>
                  <area.icon className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                {area.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { ArrowRight, Calendar, Users, Brain, HandHeart, Heart } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import FocusAreasSection from '@/components/home/FocusAreasSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <FocusAreasSection />

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Learn More About Our Work
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Explore the families we support, our upcoming activities, and our structured support plans.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link
              href="/families"
              className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 px-6 py-3 rounded-lg font-medium hover:bg-rose-100 transition-colors"
            >
              <Users className="h-5 w-5" />
              <span>Our Families</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-100 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </Link>
            <Link
              href="/plans"
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              <Brain className="h-5 w-5" />
              <span>Plans</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-rose-500 to-rose-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">4</div>
              <div className="text-rose-100 text-sm">Families Supported</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">15+</div>
              <div className="text-rose-100 text-sm">Active Visits</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">3</div>
              <div className="text-rose-100 text-sm">Focus Areas</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">12+</div>
              <div className="text-rose-100 text-sm">Student Volunteers</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Promo */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <span className="text-3xl">🏝️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Need Support Guidance?
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Our AI assistant can provide compassionate communication advice,
              emotional support strategies, and activity suggestions for supporting
              families and individuals in your community.
            </p>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600 transition-colors"
            >
              Try AI Assistant
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

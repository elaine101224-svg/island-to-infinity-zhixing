import Link from 'next/link';
import { ArrowRight, Calendar, Users, Brain, HandHeart, Heart } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import FocusAreasSection from '@/components/home/FocusAreasSection';
import ZhixingTimelineTop from '@/components/home/ZhixingTimelineTop';

export default function Home() {
  return (
    <>
      <ZhixingTimelineTop />
      <HeroSection />
      <AboutSection />
      <FocusAreasSection />

      {/* CTA Section */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            Learn More About Our Work
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
            Explore the families we support, our upcoming activities, and our structured support plans.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link
              href="/families"
              className="flex items-center justify-center gap-2.5 bg-rose-500 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200"
            >
              <Users className="h-5 w-5" />
              <span>Our Families</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center justify-center gap-2.5 bg-violet-500 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-violet-600 transition-colors shadow-sm shadow-violet-200"
            >
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </Link>
            <Link
              href="/plans"
              className="flex items-center justify-center gap-2.5 bg-blue-500 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
            >
              <Brain className="h-5 w-5" />
              <span>Plans</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 sm:py-14 bg-gradient-to-r from-rose-500 to-rose-600 text-white">
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
      <section className="py-14 sm:py-18 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-violet-50 via-white to-rose-50 rounded-2xl p-8 sm:p-10 text-center border border-slate-100 shadow-sm">
            <div className="flex justify-center mb-5">
              <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100">
                <span className="text-4xl">🏝️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              Need Support Guidance?
            </h2>
            <p className="text-slate-600 mb-7 max-w-xl mx-auto leading-relaxed">
              Our AI assistant can provide compassionate communication advice,
              emotional support strategies, and activity suggestions for supporting
              families and individuals in your community.
            </p>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-2 bg-rose-500 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200"
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

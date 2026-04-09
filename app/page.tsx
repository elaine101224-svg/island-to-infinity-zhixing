import Link from 'next/link';
import { ArrowRight, Calendar, Users, Brain } from 'lucide-react';
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
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mb-3 tracking-wide">
            Learn More About Our Work
          </h2>
          <p className="text-base text-slate-500 mb-8 max-w-xl mx-auto">
            Explore the families we support, our upcoming activities, and our structured support plans.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <Link
              href="/families"
              className="flex items-center justify-center gap-2.5 bg-rose-100 text-rose-600 px-5 py-3 rounded-xl font-medium hover:bg-rose-200 transition-all duration-300 border border-rose-200/80"
            >
              <Users className="h-4 w-4" />
              <span>Our Families</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center justify-center gap-2.5 bg-violet-100 text-violet-600 px-5 py-3 rounded-xl font-medium hover:bg-violet-200 transition-all duration-300 border border-violet-200/80"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </Link>
            <Link
              href="/plans"
              className="flex items-center justify-center gap-2.5 bg-blue-100 text-blue-600 px-5 py-3 rounded-xl font-medium hover:bg-blue-200 transition-all duration-300 border border-blue-200/80"
            >
              <Brain className="h-4 w-4" />
              <span>Plans</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-10 sm:py-12 bg-gradient-to-r from-rose-400 to-rose-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-0.5">4</div>
              <div className="text-rose-100 text-xs tracking-wide">Families Supported</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-0.5">15+</div>
              <div className="text-rose-100 text-xs tracking-wide">Active Visits</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-0.5">3</div>
              <div className="text-rose-100 text-xs tracking-wide">Focus Areas</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-0.5">12+</div>
              <div className="text-rose-100 text-xs tracking-wide">Student Volunteers</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Promo */}
      <section className="py-10 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-violet-50 via-white to-rose-50 rounded-2xl p-8 sm:p-10 text-center border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-center mb-5">
              <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100">
                <span className="text-4xl">🏝️</span>
              </div>
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-3 tracking-wide">
              Need Support Guidance?
            </h2>
            <p className="text-slate-500 mb-7 max-w-xl mx-auto leading-relaxed text-sm">
              Our AI assistant can provide compassionate communication advice,
              emotional support strategies, and activity suggestions for supporting
              families and individuals in your community.
            </p>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-2 bg-rose-200 text-rose-700 px-7 py-3 rounded-xl font-medium hover:bg-rose-300 transition-all duration-300 border border-rose-200"
            >
              Try AI Assistant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

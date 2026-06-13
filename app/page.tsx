import Link from 'next/link';
import { ArrowRight, Calendar, Users, Brain } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import FocusAreasSection from '@/components/home/FocusAreasSection';
import TimelineTop from '@/components/home/TimelineTop';

export default function Home() {
  return (
    <>
      <TimelineTop />
      <HeroSection />
      <AboutSection />
      <FocusAreasSection />

      {/* CTA Section */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-display text-2xl sm:text-3xl font-semibold text-earth-dark mb-3">
            Learn More About Our Work
          </h2>
          <p className="text-base text-earth-mid mb-8 max-w-xl mx-auto">
            Explore the families we support, our upcoming activities, and our structured support plans.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <Link
              href="/families"
              className="flex items-center justify-center gap-2.5 bg-terracotta/10 text-terracotta px-5 py-3 font-medium hover:bg-terracotta/20 transition-all duration-300 border border-terracotta/20 btn-sophisticated"
            >
              <Users className="h-4 w-4" />
              <span>Our Families</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center justify-center gap-2.5 bg-sage/10 text-sage px-5 py-3 font-medium hover:bg-sage/20 transition-all duration-300 border border-sage/20 btn-sophisticated"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </Link>
            <Link
              href="/plans"
              className="flex items-center justify-center gap-2.5 bg-amber-warm/10 text-amber-warm px-5 py-3 font-medium hover:bg-amber-warm/20 transition-all duration-300 border border-amber-warm/20 btn-sophisticated"
            >
              <Brain className="h-4 w-4" />
              <span>Plans</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-10 sm:py-12 bg-gradient-to-r from-earth-dark to-earth-mid text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="display-number text-4xl sm:text-5xl font-semibold mb-1">4</div>
              <div className="text-amber-light/60 text-xs tracking-widest uppercase">Families</div>
            </div>
            <div>
              <div className="display-number text-4xl sm:text-5xl font-semibold mb-1">15+</div>
              <div className="text-amber-light/60 text-xs tracking-widest uppercase">Visits</div>
            </div>
            <div>
              <div className="display-number text-4xl sm:text-5xl font-semibold mb-1">3</div>
              <div className="text-amber-light/60 text-xs tracking-widest uppercase">Focus Areas</div>
            </div>
            <div>
              <div className="display-number text-4xl sm:text-5xl font-semibold mb-1">12+</div>
              <div className="text-amber-light/60 text-xs tracking-widest uppercase">Volunteers</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Promo */}
      <section className="py-10 sm:py-14 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-light/30 via-white to-terracotta-light/20 rounded-sm p-8 sm:p-10 text-center border border-sand shadow-sm">
            <div className="flex justify-center mb-5">
              <div className="bg-white p-4 shadow-sm border border-sand">
                <span className="text-4xl">🏝️</span>
              </div>
            </div>
            <h2 className="heading-display text-2xl font-semibold text-earth-dark mb-3">
              Need Support Guidance?
            </h2>
            <p className="text-earth-mid mb-7 max-w-xl mx-auto leading-relaxed text-sm">
              Our AI assistant can provide compassionate communication advice,
              emotional support strategies, and activity suggestions for supporting
              families and individuals in your community.
            </p>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-2 bg-terracotta text-white px-8 py-3 font-medium hover:bg-terracotta-dark transition-all duration-300 btn-sophisticated"
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

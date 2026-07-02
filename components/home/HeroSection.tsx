import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-cream via-cream to-white pb-10 sm:pb-14 overflow-hidden">
      {/* warm terracotta glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-terracotta-light/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16">
        {/* title */}
        <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl font-semibold text-earth-dark mb-4 leading-tight">
          Island to Infinity
        </h1>

        {/* subtitle */}
        <p className="text-lg sm:text-xl text-earth-mid font-light mb-6 italic">
          Building Bridges of Compassion in Changshu
        </p>

        {/* description */}
        <p className="text-base text-earth-light leading-relaxed max-w-2xl mx-auto mb-8">
          Every family is an island. Through meaningful relationships, shared
          experiences, and consistent support, we create lasting connections that
          turn isolation into community.
        </p>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/families"
            className="px-8 py-3 bg-gradient-to-r from-terracotta to-terracotta-dark text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm btn-sophisticated"
          >
            Meet Our Families
          </Link>
          <Link
            href="/schedule"
            className="px-8 py-3 bg-white border border-sand text-earth-dark font-medium text-sm hover:bg-sand/50 transition-colors shadow-sm btn-sophisticated"
          >
            View Activities
          </Link>
        </div>
      </div>
    </section>
  );
}

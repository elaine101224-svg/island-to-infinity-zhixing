import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-cream via-cream to-white pb-8 sm:pb-12 overflow-hidden">
      {/* warm terracotta glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-terracotta-light/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* icon */}
        <div className="flex justify-center mb-7">
          <div className="bg-gradient-to-br from-terracotta-light/50 to-terracotta-light/20 p-4 rounded-2xl shadow-sm">
            <span className="text-4xl">🏝️</span>
          </div>
        </div>

        {/* label */}
        <p className="text-xs font-semibold text-terracotta uppercase tracking-widest mb-3 opacity-0 absolute -z-10">
          Island to Infinity
        </p>

        {/* title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-earth-dark mb-5 tracking-tight leading-tight">
          Island to Infinity
        </h1>

        {/* subtitle */}
        <p className="text-lg sm:text-xl text-earth-mid font-light mb-6 italic">
          Building Bridges of Compassion in Changshu
        </p>

        {/* description */}
        <p className="text-base text-earth-light leading-relaxed max-w-2xl mx-auto">
          Every family is an island. Through meaningful relationships, shared
          experiences, and consistent support, we create lasting connections that
          turn isolation into community.
        </p>
      </div>
    </section>
  );
}
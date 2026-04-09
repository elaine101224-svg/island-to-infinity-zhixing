import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 via-white to-white py-14 sm:py-20 overflow-hidden">
      {/* subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* icon */}
        <div className="flex justify-center mb-7">
          <div className="bg-gradient-to-br from-rose-100 to-rose-50 p-4 rounded-2xl shadow-md">
            <span className="text-4xl">🏝️</span>
          </div>
        </div>

        {/* label */}
        <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3 letter-spacing-wide">
          Zhixing Initiative
        </p>

        {/* title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-slate-900 mb-5 tracking-tight leading-tight">
          Island to Infinity
        </h1>

        {/* subtitle */}
        <p className="text-lg sm:text-xl text-slate-500 font-light mb-6 italic">
          Building Bridges of Compassion in Changshu
        </p>

        {/* description */}
        <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Every family is an island. Through meaningful relationships, shared
          experiences, and consistent support, we create lasting connections that
          turn isolation into community.
        </p>
      </div>
    </section>
  );
}

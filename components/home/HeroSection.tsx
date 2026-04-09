import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 via-white to-white py-20 sm:py-28 overflow-hidden">
      {/* subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-rose-100 to-rose-50 p-5 rounded-2xl shadow-md">
            <span className="text-5xl">🏝️</span>
          </div>
        </div>

        {/* label */}
        <p className="text-sm font-medium text-rose-500 mb-3">
          Zhixing Initiative
        </p>

        {/* title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
          Island to Infinity
        </h1>

        {/* subtitle */}
        <p className="text-xl sm:text-2xl text-slate-600 font-medium mb-6">
          Building Bridges of Compassion in Changshu
        </p>

        {/* description */}
        <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
          Every family is an island. Through meaningful relationships, shared
          experiences, and consistent support, we create lasting connections that
          turn isolation into community.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/families"
            className="bg-rose-500 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-rose-600 transition-all duration-300 hover:scale-[1.02]"
          >
            Explore Families
          </Link>

          <Link
            href="/plans"
            className="bg-white text-slate-700 px-6 py-3 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-[1.02]"
          >
            View Plans
          </Link>
        </div>
      </div>
    </section>
  );
}

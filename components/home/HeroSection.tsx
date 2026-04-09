export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-slate-50 via-white to-white py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-rose-100 to-rose-50 p-5 rounded-2xl shadow-lg shadow-rose-200/50">
            <span className="text-6xl">🏝️</span>
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Island to Infinity Zhixing
        </h1>
        <p className="text-xl sm:text-2xl text-rose-500 font-medium mb-8">
          Building Bridges of Compassion in Changshu
        </p>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Every family is an island. We believe that no one should feel isolated.
          Through meaningful connections and heartfelt support, we help build
          infinite bridges between hearts.
        </p>
      </div>
    </section>
  );
}

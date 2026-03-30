import { Heart } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-rose-50 to-white py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-rose-100 p-4 rounded-full">
            <Heart className="h-12 w-12 text-rose-500" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Island to Infinity Zhixing
        </h1>
        <p className="text-xl sm:text-2xl text-rose-600 font-medium mb-6">
          Building Bridges of Compassion in Changshu
        </p>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Every family is an island. We believe that no one should feel isolated.
          Through meaningful connections and heartfelt support, we help build
          infinite bridges between hearts.
        </p>
      </div>
    </section>
  );
}

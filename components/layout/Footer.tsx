import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-earth-dark text-amber-light/80 border-t border-earth-mid/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Mission */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-terracotta/20 p-2 rounded-xl">
                <span className="text-2xl">🏝️</span>
              </div>
              <div>
                <span className="font-semibold text-white text-base">Island to Infinity</span>
                <p className="text-xs text-amber-light/40">Changshu, China</p>
              </div>
            </div>
            <p className="text-sm text-amber-light/60 leading-relaxed">
              Building bridges of compassion. We believe every family is an island,
              and together we can create infinite connections.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-amber-light/40">
              <Heart className="h-3.5 w-3.5 text-terracotta-light" />
              <span>Student-led initiative</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm tracking-wide">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/families" className="text-amber-light/60 hover:text-terracotta-light transition-colors inline-flex items-center gap-1.5">
                  Our Families
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-amber-light/60 hover:text-terracotta-light transition-colors inline-flex items-center gap-1.5">
                  Upcoming Activities
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-amber-light/60 hover:text-terracotta-light transition-colors inline-flex items-center gap-1.5">
                  Support Plans
                </Link>
              </li>
              <li>
                <Link href="/ai-assistant" className="text-amber-light/60 hover:text-terracotta-light transition-colors inline-flex items-center gap-1.5">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm tracking-wide">Our Focus</h3>
            <ul className="space-y-2.5 text-sm text-amber-light/60">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                Mental Health Support
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-terracotta-light flex-shrink-0" />
                Companionship &amp; Care
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-warm flex-shrink-0" />
                Social Integration
              </li>
            </ul>
            <div className="mt-5 pt-4 border-t border-earth-mid/30">
              <p className="text-xs text-amber-light/40 leading-relaxed">
                Working with the Changshu Women&apos;s Federation
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-earth-mid/30 mt-10 pt-6 text-center">
          <p className="text-xs text-amber-light/40">
            All family information is anonymized to protect privacy. Built with care.
          </p>
        </div>
      </div>
    </footer>
  );
}

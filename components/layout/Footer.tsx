import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-earth-mid text-amber-light/80 border-t border-earth-light/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="bg-terracotta/20 p-1.5 rounded-lg">
                <span className="text-xl">🏝️</span>
              </div>
              <span className="font-semibold text-white">Island to Infinity</span>
            </div>
            <p className="text-sm text-amber-light/60 leading-relaxed">
              Building bridges of compassion in Changshu. We believe every family is an island,
              and together we can create infinite connections.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/families" className="text-amber-light/60 hover:text-terracotta-light transition-colors">
                  Our Families
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-amber-light/60 hover:text-terracotta-light transition-colors">
                  Upcoming Activities
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-amber-light/60 hover:text-terracotta-light transition-colors">
                  Support Plans
                </Link>
              </li>
              <li>
                <Link href="/ai-assistant" className="text-amber-light/60 hover:text-terracotta-light transition-colors">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Our Focus Areas</h3>
            <ul className="space-y-2 text-sm text-amber-light/60">
              <li>Mental Health Support</li>
              <li>Companionship & Care</li>
              <li>Social Integration</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-earth-mid/30 mt-8 pt-6 text-center">
          <p className="text-sm text-amber-light/40">
            A student-led initiative in Changshu, China. All family information is anonymized to protect privacy.
          </p>
        </div>
      </div>
    </footer>
  );
}
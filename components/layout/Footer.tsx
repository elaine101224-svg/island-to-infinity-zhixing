import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="bg-rose-500/20 p-1.5 rounded-lg">
                <span className="text-xl">🏝️</span>
              </div>
              <span className="font-semibold text-white">Island to Infinity Zhixing</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Building bridges of compassion in Changshu. We believe every family is an island,
              and together we can create infinite connections.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/families" className="text-slate-400 hover:text-rose-400 transition-colors">
                  Our Families
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-slate-400 hover:text-rose-400 transition-colors">
                  Upcoming Activities
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-slate-400 hover:text-rose-400 transition-colors">
                  Support Plans
                </Link>
              </li>
              <li>
                <Link href="/ai-assistant" className="text-slate-400 hover:text-rose-400 transition-colors">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Our Focus Areas</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Mental Health Support</li>
              <li>Companionship & Care</li>
              <li>Social Integration</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center">
          <p className="text-sm text-slate-500">
            A student-led initiative in Changshu, China. All family information is anonymized to protect privacy.
          </p>
        </div>
      </div>
    </footer>
  );
}

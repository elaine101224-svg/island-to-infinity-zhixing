import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-rose-500" />
              <span className="font-semibold text-gray-800">Island to Infinity Zhixing</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Building bridges of compassion in Changshu. We believe every family is an island,
              and together we can create infinite connections.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/families" className="text-gray-600 hover:text-rose-500 transition-colors">
                  Our Families
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-gray-600 hover:text-rose-500 transition-colors">
                  Upcoming Activities
                </Link>
              </li>
              <li>
                <Link href="/plans" className="text-gray-600 hover:text-rose-500 transition-colors">
                  Support Plans
                </Link>
              </li>
              <li>
                <Link href="/ai-assistant" className="text-gray-600 hover:text-rose-500 transition-colors">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Our Focus Areas</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Mental Health Support</li>
              <li>Companionship & Care</li>
              <li>Social Integration</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500">
            A student-led initiative in Changshu, China. All family information is anonymized to protect privacy.
          </p>
        </div>
      </div>
    </footer>
  );
}

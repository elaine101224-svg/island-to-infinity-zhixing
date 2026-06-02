'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, Lock } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/families', label: 'Families' },
  { href: '/plans', label: 'Plans' },
  { href: '/ai-assistant', label: 'AI Assistant' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-cream/90 backdrop-blur-md border-b border-sand sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-br from-terracotta-light/60 to-terracotta-light/30 p-2 rounded-xl shadow-sm group-hover:shadow-md transition-all">
                <span className="text-xl">🏝️</span>
              </div>
              <span className="font-semibold text-lg text-earth-dark hidden sm:block">
                Island to Infinity
              </span>
              <span className="font-semibold text-lg text-earth-dark sm:hidden">
                Island to Infinity
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-earth-mid hover:text-terracotta rounded-lg hover:bg-terracotta/5 transition-all font-medium text-sm"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="ml-2 px-4 py-2 text-white bg-earth-dark hover:bg-earth-mid rounded-lg transition-colors font-medium text-sm flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-earth-mid hover:text-earth-dark p-2 rounded-lg hover:bg-sand/50 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-cream border-t border-sand">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 text-earth-mid hover:text-terracotta hover:bg-terracotta/5 rounded-lg font-medium text-sm transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2.5 text-white bg-earth-dark hover:bg-earth-mid rounded-lg font-medium text-sm transition-colors mt-2"
              onClick={() => setIsOpen(false)}
            >
              <Lock className="h-4 w-4" />
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
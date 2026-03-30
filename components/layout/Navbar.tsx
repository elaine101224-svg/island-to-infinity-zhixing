'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Heart } from 'lucide-react';

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
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-rose-500" />
              <span className="font-semibold text-lg text-gray-800 hidden sm:block">
                Island to Infinity Zhixing
              </span>
              <span className="font-semibold text-lg text-gray-800 sm:hidden">
                Island to Infinity
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-rose-500 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-gray-600 hover:text-rose-500 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

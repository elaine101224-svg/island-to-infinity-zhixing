'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Lock } from 'lucide-react';
import Logo from '@/components/ui/Logo';

// Follow the visitor's path: introduction, people, families, work, then dates.
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#team', label: 'Our Team' },
  { href: '/families', label: 'Families' },
  { href: '/plans', label: 'Plans' },
  { href: '/schedule', label: 'Schedule' },
];
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-earth-dark';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !nav.current?.contains(event.target)) setIsOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setIsOpen(false); toggle.current?.focus(); }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [isOpen]);

  const active = (href: string) => !href.includes('#') && (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));
  const close = () => setIsOpen(false);

  return (
    <nav ref={nav} aria-label="Main navigation" className="bg-cream/95 border-b border-sand sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          <Link href="/" onClick={close} className={`flex shrink-0 items-center gap-2.5 rounded-sm ${focus}`}>
            <Logo size={44} priority className="shrink-0" />
            <span className="font-semibold text-lg text-earth-dark whitespace-nowrap">Island to Infinity</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <ul className="flex items-center gap-5 text-sm">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} aria-current={active(link.href) ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 pt-0.5 transition-colors motion-reduce:transition-none ${focus} ${active(link.href) ? 'border-terracotta-dark text-earth-dark font-semibold' : 'border-transparent text-earth-mid font-medium hover:text-earth-dark hover:border-sand-dark'}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 border-l border-sand pl-5">
              <Link href="/sewing" aria-current={active('/sewing') ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium text-earth-dark underline-offset-4 hover:underline ${focus}`}>
                Sewing <span className="ml-1.5 text-xs text-earth-mid" lang="zh">服装定制</span>
              </Link>
              <Link href="/login" aria-current={active('/login') ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-sm text-xs text-earth-mid hover:text-earth-dark ${focus}`}>
                <Lock aria-hidden="true" className="h-3.5 w-3.5" />Admin
              </Link>
            </div>
          </div>

          <button ref={toggle} type="button" onClick={() => setIsOpen(open => !open)}
            className={`lg:hidden inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-earth-dark hover:bg-sand/50 ${focus}`}
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={isOpen} aria-controls="mobile-navigation">
            {isOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>

        <div hidden={!isOpen} id="mobile-navigation" className="lg:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-sand bg-cream px-4 pb-5 pt-2 sm:px-6">
          <ul className="space-y-1">
            {navLinks.map(link => (
              <li key={link.href}><Link href={link.href} onClick={close} aria-current={active(link.href) ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-lg px-3 text-base ${focus} ${active(link.href) ? 'bg-sand/50 font-semibold text-earth-dark' : 'font-medium text-earth-mid hover:bg-sand/30 hover:text-earth-dark'}`}>
                {link.label}
              </Link></li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-sand pt-3">
            <Link href="/sewing" onClick={close} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-earth-dark hover:bg-sand/30 ${focus}`}>
              Sewing <span className="text-earth-mid" lang="zh">服装定制</span>
            </Link>
            <Link href="/login" onClick={close} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-earth-mid hover:text-earth-dark ${focus}`}>
              <Lock aria-hidden="true" className="h-3.5 w-3.5" />Admin login
            </Link>
          </div>
        </div>
    </nav>
  );
}

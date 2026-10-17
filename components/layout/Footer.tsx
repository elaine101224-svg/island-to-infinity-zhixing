import Link from 'next/link';
import Logo from '@/components/ui/Logo';
export default function Footer() {
  return <footer className="bg-earth-dark text-cream"><div className="max-w-6xl mx-auto px-5 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6"><div className="flex items-center gap-3"><div className="bg-cream rounded-lg p-1"><Logo size={36} /></div><div><p className="font-medium">Island to Infinity</p><p className="text-sm text-sand">UWC Changshu · Changshu, China</p></div></div><div className="flex flex-wrap gap-5 text-sm"><Link href="/#team">Our Team</Link><Link href="/schedule">Activities</Link><Link href="/ai-assistant">Support guidance</Link><Link href="/login">Member login</Link></div></div></footer>;
}

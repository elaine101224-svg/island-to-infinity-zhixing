import FamilyCard from '@/components/families/FamilyCard';
import type { Family } from '@/types';
import { Users, Shield } from 'lucide-react';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';

export const dynamic = 'force-dynamic';

export default async function FamiliesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/families`);
  const families: Family[] = await res.json();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <Reveal className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-terracotta/10 p-3.5 shadow-sm border border-sand">
            <Users className="h-7 w-7 text-terracotta" />
          </div>
        </div>
        <h1 className="heading-display text-3xl font-semibold text-earth-dark mb-3">
          Families We Support
        </h1>
        <p className="text-earth-mid max-w-2xl mx-auto leading-relaxed">
          Every family is unique, with their own story, strengths, and challenges.
          We walk alongside them with respect, compassion, and commitment to their wellbeing.
        </p>
      </Reveal>

      {/* Privacy Notice */}
      <div className="bg-amber-light/20 border border-sand rounded-xl p-4 mb-8 flex items-start gap-3">
        <Shield className="h-4 w-4 text-amber-warm mt-0.5 flex-shrink-0" />
        <p className="text-sm text-earth-mid leading-relaxed">
          <strong className="text-earth-dark">Privacy Protection:</strong> All family information is anonymized.
          Pseudonyms are used instead of real names, and general locations are provided rather than specific addresses.
          Photos are only displayed with explicit consent.
        </p>
      </div>

      {/* Families Grid */}
      {families.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sand">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-lg font-semibold text-earth-dark mb-2">No families to display yet</h3>
          <p className="text-earth-mid text-sm">Check back soon as our community grows.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {families.map((family: Family, i: number) => (
            <Reveal key={family.id} delay={i * 90}>
              <Link href={`/families/${family.id}`}>
                <FamilyCard family={family} />
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      {/* Support Philosophy */}
      <Reveal className="mt-14 pt-8 border-t border-sand text-center">
        <h2 className="heading-display text-2xl font-semibold text-earth-dark mb-8">
          Our Approach
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-sand p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="text-3xl mb-3">🤝</div>
            <p className="text-sm font-semibold text-earth-dark mb-1.5">With Respect</p>
            <p className="text-xs text-earth-mid leading-relaxed">
              We treat every family with dignity and honor their autonomy in all decisions.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-sand p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="text-3xl mb-3">🏖️</div>
            <p className="text-sm font-semibold text-earth-dark mb-1.5">With Heart</p>
            <p className="text-xs text-earth-mid leading-relaxed">
              Our support comes from genuine care and a desire to build lasting human connections.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-sand p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="text-3xl mb-3">🌱</div>
            <p className="text-sm font-semibold text-earth-dark mb-1.5">For Growth</p>
            <p className="text-xs text-earth-mid leading-relaxed">
              We focus on empowerment, helping families build resilience and independence.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

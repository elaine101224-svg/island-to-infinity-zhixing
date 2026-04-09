import FamilyCard from '@/components/families/FamilyCard';
import type { Family } from '@/types';
import { Users, Shield } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FamiliesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/families`);
  const families: Family[] = await res.json();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <Users className="mx-auto mb-3 h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold mb-2">Families We Support</h1>
        <p className="text-gray-600">
          Every family is unique, with their own story, strengths, and challenges.
          We walk alongside them with respect, compassion, and commitment to their wellbeing.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-100 border border-gray-300 rounded p-3 mb-6 flex items-center gap-2">
        <Shield className="h-4 w-4 text-gray-600" />
        <p className="text-sm text-gray-700">
          <strong>Privacy Protection:</strong> All family information is anonymized.
          Pseudonyms are used instead of real names, and general locations are provided rather than specific addresses.
          Photos are only displayed with explicit consent.
        </p>
      </div>

      {/* Families Grid */}
      {families.length === 0 ? (
        <p className="text-center text-gray-600">No families to display at this time.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {families.map((family: Family) => (
            <Link key={family.id} href={`/families/${family.id}`}>
              <FamilyCard family={family} />
            </Link>
          ))}
        </div>
      )}

      {/* Support Philosophy */}
      <div className="mt-10 border-t pt-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Our Approach</h2>
        <div className="flex justify-around">
          <div>
            <div className="text-2xl mb-1">🤝</div>
            <p className="text-sm font-medium">With Respect</p>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              We treat every family with dignity and honor their autonomy in all decisions.
            </p>
          </div>
          <div>
            <div className="text-2xl mb-1">🏖️</div>
            <p className="text-sm font-medium">With Heart</p>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              Our support comes from genuine care and a desire to build lasting human connections.
            </p>
          </div>
          <div>
            <div className="text-2xl mb-1">🌱</div>
            <p className="text-sm font-medium">For Growth</p>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              We focus on empowerment, helping families build resilience and independence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
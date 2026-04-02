import { getFamilies } from '@/lib/data';
import FamilyCard from '@/components/families/FamilyCard';
import { Users, Shield } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FamiliesPage() {
  const families = await getFamilies();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-yellow-50">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-200 p-3 rounded-full shadow-md">
            <Users className="h-8 w-8 text-yellow-700" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-yellow-900 mb-3">
          Families We Support
        </h1>
        <p className="text-yellow-800 max-w-2xl mx-auto">
          Every family is unique, with their own story, strengths, and challenges.
          We walk alongside them with respect, compassion, and commitment to their wellbeing.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Privacy Protection:</strong> All family information is anonymized.
          Pseudonyms are used instead of real names, and general locations are provided
          rather than specific addresses. Photos are only displayed with explicit consent.
        </div>
      </div>

      {/* Families Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {families.map(family => (
          <Link key={family.id} href={`/families/${family.id}`} passHref>
            <FamilyCard family={family} />
          </Link>
        ))}
      </div>

      {/* Support Philosophy */}
      <div className="mt-12 bg-yellow-50 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-yellow-900 mb-4 text-center">
          Our Approach
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-medium text-yellow-900 mb-1">With Respect</h3>
            <p className="text-sm text-yellow-800">
              We treat every family with dignity and honor their autonomy in all decisions.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🏖️</div>
            <h3 className="font-medium text-yellow-900 mb-1">With Heart</h3>
            <p className="text-sm text-yellow-800">
              Our support comes from genuine care and a desire to build lasting human connections.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🌱</div>
            <h3 className="font-medium text-yellow-900 mb-1">For Growth</h3>
            <p className="text-sm text-yellow-800">
              We focus on empowerment, helping families build resilience and independence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
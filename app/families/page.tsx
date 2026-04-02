import { getFamilies } from '@/lib/data';
import FamilyCard from '@/components/families/FamilyCard';
import { Users, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FamiliesPage() {
  const families = await getFamilies();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-rose-100 p-3 rounded-full">
            <Users className="h-8 w-8 text-rose-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Families We Support
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {families.map(family => (
          <FamilyCard key={family.id} family={family} />
        ))}
      </div>
    </div>
  );
}
import Link from 'next/link';
import { getFamilies } from '@/lib/data';
import { Users, ArrowRight, MapPin, Check, X } from 'lucide-react';

export default async function AdminFamiliesPage() {
  const families = await getFamilies();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Families</h1>
          <p className="text-gray-500 text-sm mt-1">Manage family profiles</p>
        </div>
        <button className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors text-sm">
          Add Family
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pseudonym
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Composition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {families.map((family) => (
              <tr key={family.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 p-2 rounded-lg">
                      <Users className="h-4 w-4 text-rose-600" />
                    </div>
                    <span className="font-medium text-gray-900">{family.pseudonym}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="h-4 w-4" />
                    {family.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {family.familyComposition.adults}A / {family.familyComposition.children}C / {family.familyComposition.elderly}E
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {family.consentGiven ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="h-4 w-4" />
                      {family.photos.length} photos
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <X className="h-4 w-4" />
                      No photos
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/families/${family.id}`}
                    className="text-rose-500 hover:text-rose-600 flex items-center gap-1"
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-center">
        <Link href="/families" className="text-gray-500 hover:text-rose-500 text-sm">
          View Public Families Page
        </Link>
      </div>
    </div>
  );
}

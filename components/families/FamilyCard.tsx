import Link from 'next/link';
import { MapPin, Users as UsersIcon, ChevronRight } from 'lucide-react';
import type { Family } from '@/types';

interface FamilyCardProps {
  family: Family;
}

export default function FamilyCard({ family }: FamilyCardProps) {
  const totalMembers =
    family.familyComposition.adults +
    family.familyComposition.children +
    family.familyComposition.elderly;

  return (
    <Link href={`/families/${family.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-rose-200 transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">
              {family.pseudonym}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
              <MapPin className="h-4 w-4" />
              <span>{family.location}</span>
            </div>
          </div>
          {family.consentGiven && family.photos.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Photos
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <UsersIcon className="h-4 w-4 text-gray-400" />
            <span>{totalMembers} members</span>
          </div>
          <div className="flex items-center gap-3">
            {family.familyComposition.elderly > 0 && (
              <span className="text-amber-600">
                {family.familyComposition.elderly} elderly
              </span>
            )}
            {family.familyComposition.children > 0 && (
              <span className="text-blue-600">
                {family.familyComposition.children} children
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {family.currentSituation}
        </p>

        <div className="flex items-center text-rose-500 font-medium text-sm group-hover:gap-2 transition-all">
          <span>View Profile</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

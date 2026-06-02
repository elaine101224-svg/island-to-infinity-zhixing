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
    <div className="bg-white border border-sand rounded-2xl p-6 hover:shadow-lg hover:border-terracotta-light transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-earth-dark group-hover:text-terracotta transition-colors">
            {family.pseudonym}
          </h3>
          <div className="flex items-center gap-1.5 text-earth-light text-sm mt-1.5">
            <MapPin className="h-4 w-4" />
            <span>{family.location}</span>
          </div>
        </div>
        {family.consentGiven && family.photos.length > 0 && (
          <span className="text-xs bg-sage/20 text-sage px-2.5 py-1 rounded-full font-medium">
            Photos
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-earth-mid">
        <div className="flex items-center gap-1.5">
          <UsersIcon className="h-4 w-4 text-earth-light" />
          <span>{totalMembers} members</span>
        </div>
        <div className="flex items-center gap-3">
          {family.familyComposition.elderly > 0 && (
            <span className="text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full text-xs font-medium">
              {family.familyComposition.elderly} elderly
            </span>
          )}
          {family.familyComposition.children > 0 && (
            <span className="text-sage bg-sage/10 px-2 py-0.5 rounded-full text-xs font-medium">
              {family.familyComposition.children} children
            </span>
          )}
        </div>
      </div>

      <p className="text-earth-mid text-sm leading-relaxed line-clamp-3 mb-4">
        {family.currentSituation}
      </p>

      <div className="flex items-center text-terracotta font-medium text-sm group-hover:gap-2.5 transition-all">
        <span>View Profile</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
}
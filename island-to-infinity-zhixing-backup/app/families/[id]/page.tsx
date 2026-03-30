import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users as UsersIcon, Calendar } from 'lucide-react';
import { getFamilyById, getPlansByFamilyId } from '@/lib/data';
import PhotoGallery from '@/components/families/PhotoGallery';
import PlanCard from '@/components/plans/PlanCard';
import { format } from 'date-fns';

interface FamilyPageProps {
  params: Promise<{ id: string }>;
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { id } = await params;
  const family = await getFamilyById(id);

  if (!family) {
    notFound();
  }

  const plans = await getPlansByFamilyId(id);

  const totalMembers =
    family.familyComposition.adults +
    family.familyComposition.children +
    family.familyComposition.elderly;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link
        href="/families"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-500 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Families</span>
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {family.pseudonym}
        </h1>

        <div className="flex items-center gap-4 text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{family.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <UsersIcon className="h-4 w-4 text-gray-400" />
            <span>{totalMembers} family members</span>
          </div>
        </div>

        {/* Family Composition */}
        <div className="flex flex-wrap gap-3 mb-4">
          {family.familyComposition.adults > 0 && (
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {family.familyComposition.adults} adult{family.familyComposition.adults > 1 ? 's' : ''}
            </span>
          )}
          {family.familyComposition.children > 0 && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              {family.familyComposition.children} child{family.familyComposition.children > 1 ? 'ren' : ''}
            </span>
          )}
          {family.familyComposition.elderly > 0 && (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
              {family.familyComposition.elderly} elder{family.familyComposition.elderly > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Background */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Background</h2>
          <p className="text-gray-600 leading-relaxed">{family.background}</p>
        </div>

        {/* Current Situation */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Situation</h2>
          <p className="text-gray-600 leading-relaxed">{family.currentSituation}</p>
        </div>

        {/* Key Challenges */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Challenges</h2>
          <ul className="space-y-2">
            {family.keyChallenges.map((challenge, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-600">
                <span className="text-rose-400 mt-1">•</span>
                <span>{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interaction Highlights */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Interaction Highlights
        </h2>
        <div className="space-y-6">
          {family.highlights.map((highlight, index) => (
            <div
              key={index}
              className="border-l-4 border-rose-300 pl-4 pb-4 last:pb-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {format(new Date(highlight.date), 'MMMM d, yyyy')}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{highlight.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Gallery */}
      {family.consentGiven && family.photos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Photo Gallery
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These photos are shared with explicit consent from the family.
          </p>
          <PhotoGallery photos={family.photos} familyPseudonym={family.pseudonym} />
        </div>
      )}

      {/* Related Plans */}
      {plans.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Support Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Privacy Reminder */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
        <p>
          All information about this family is anonymized and shared with their consent.
          We are committed to protecting their privacy and dignity.
        </p>
      </div>
    </div>
  );
}

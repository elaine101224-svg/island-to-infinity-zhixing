import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users as UsersIcon, Calendar, Shield } from 'lucide-react';
import PhotoGallery from '@/components/families/PhotoGallery';
import PlanCard from '@/components/plans/PlanCard';
import { format } from 'date-fns';
import type { Family, SupportPlan } from '@/types';

export const dynamic = 'force-dynamic';

interface FamilyPageProps {
  params: Promise<{ id: string }>;
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const [familyRes, plansRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/families/${id}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/admin/plans?familyId=${id}`, { cache: 'no-store' }),
  ]);

  if (!familyRes.ok) {
    notFound();
  }

  const family: Family = await familyRes.json();
  const plans: SupportPlan[] = plansRes.ok ? await plansRes.json() : [];

  const totalMembers =
    family.familyComposition.adults +
    family.familyComposition.children +
    family.familyComposition.elderly;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link
        href="/families"
        className="inline-flex items-center gap-2 text-earth-mid hover:text-terracotta mb-8 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Families</span>
      </Link>

      {/* Header Card */}
      <div className="bg-white border border-sand rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-earth-dark mb-2 tracking-wide">
              {family.pseudonym}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-earth-mid">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-earth-light" />
                <span>{family.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4 text-earth-light" />
                <span>{totalMembers} family members</span>
              </div>
            </div>
          </div>
          <div className="bg-sage/10 text-sage px-3 py-1 rounded-full text-xs font-medium border border-sage/20">
            Anonymized
          </div>
        </div>

        {/* Family Composition */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          {family.familyComposition.adults > 0 && (
            <span className="bg-sand text-earth-dark px-3 py-1.5 rounded-full text-sm font-medium">
              {family.familyComposition.adults} adult{family.familyComposition.adults > 1 ? 's' : ''}
            </span>
          )}
          {family.familyComposition.children > 0 && (
            <span className="bg-terracotta/10 text-terracotta-dark px-3 py-1.5 rounded-full text-sm font-medium">
              {family.familyComposition.children} child{family.familyComposition.children > 1 ? 'ren' : ''}
            </span>
          )}
          {family.familyComposition.elderly > 0 && (
            <span className="bg-amber-light/40 text-amber-warm px-3 py-1.5 rounded-full text-sm font-medium">
              {family.familyComposition.elderly} elder{family.familyComposition.elderly > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Background */}
        <div className="mb-6">
          <h2 className="text-lg font-serif font-semibold text-earth-dark mb-2 tracking-wide">Background</h2>
          <p className="text-earth-mid leading-relaxed">{family.background}</p>
        </div>

        {/* Current Situation */}
        <div className="mb-6">
          <h2 className="text-lg font-serif font-semibold text-earth-dark mb-2 tracking-wide">Current Situation</h2>
          <p className="text-earth-mid leading-relaxed">{family.currentSituation}</p>
        </div>

        {/* Key Challenges */}
        <div>
          <h2 className="text-lg font-serif font-semibold text-earth-dark mb-3 tracking-wide">Key Challenges</h2>
          <ul className="space-y-2.5">
            {family.keyChallenges.map((challenge, index) => (
              <li key={index} className="flex items-start gap-3 text-earth-mid text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interaction Highlights */}
      <div className="bg-white border border-sand rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-serif font-semibold text-earth-dark mb-6 tracking-wide">
          Interaction Highlights
        </h2>
        <div className="space-y-6">
          {family.highlights.map((highlight, index) => (
            <div
              key={index}
              className="relative pl-8 pb-6 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-terracotta border-2 border-cream shadow-sm" />
              {/* Timeline line */}
              {index < family.highlights.length - 1 && (
                <div className="absolute left-[5px] top-4 bottom-0 w-px bg-sand" />
              )}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 text-earth-light" />
                <span className="text-xs text-earth-mid font-medium">
                  {format(new Date(highlight.date), 'MMMM d, yyyy')}
                </span>
              </div>
              <h3 className="font-semibold text-earth-dark mb-1.5">{highlight.title}</h3>
              <p className="text-earth-mid text-sm leading-relaxed">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Gallery */}
      {family.consentGiven && family.photos.length > 0 && (
        <div className="bg-white border border-sand rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-serif font-semibold text-earth-dark tracking-wide">
              Photo Gallery
            </h2>
            <span className="bg-sage/20 text-sage px-2 py-0.5 rounded-full text-xs font-medium">Consent Given</span>
          </div>
          <p className="text-xs text-earth-light mb-5">
            These photos are shared with explicit consent from the family.
          </p>
          <PhotoGallery photos={family.photos} familyPseudonym={family.pseudonym} />
        </div>
      )}

      {/* Related Plans */}
      {plans.length > 0 && (
        <div className="bg-white border border-sand rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-serif font-semibold text-earth-dark mb-6 tracking-wide">
            Support Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Privacy Reminder */}
      <div className="mt-6 p-4 bg-amber-light/20 rounded-xl border border-sand flex items-start gap-3">
        <Shield className="h-4 w-4 text-amber-warm mt-0.5 flex-shrink-0" />
        <p className="text-xs text-earth-mid leading-relaxed">
          All information about this family is anonymized and shared with their consent.
          We are committed to protecting their privacy and dignity.
        </p>
      </div>
    </div>
  );
}

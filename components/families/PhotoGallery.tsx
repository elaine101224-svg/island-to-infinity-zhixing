'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Photo } from '@/types';

interface PhotoGalleryProps {
  photos: Photo[];
  familyPseudonym: string;
}

export default function PhotoGallery({ photos, familyPseudonym }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const openModal = (index: number) => setSelectedIndex(index);
  const closeModal = () => setSelectedIndex(null);
  const goNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % photos.length);
    }
  };
  const goPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => openModal(index)}
            className="relative aspect-square rounded-xl overflow-hidden group"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-earth-dark/0 group-hover:bg-earth-dark/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-earth-dark/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-amber-light/60 hover:text-white p-2 rounded-lg hover:bg-earth-mid/30 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-7 w-7" />
          </button>

          <button
            onClick={goPrev}
            className="absolute left-4 text-amber-light/60 hover:text-white p-2 rounded-lg hover:bg-earth-mid/30 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-9 w-9" />
          </button>

          <div className="max-w-4xl max-h-full">
            <img
              src={photos[selectedIndex].url}
              alt={photos[selectedIndex].caption}
              decoding="async"
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
            <p className="text-amber-light text-center mt-4 text-sm">
              {photos[selectedIndex].caption}
            </p>
            <p className="text-amber-light/40 text-center text-xs mt-1">
              {familyPseudonym} &mdash; Photo {selectedIndex + 1} of {photos.length}
            </p>
          </div>

          <button
            onClick={goNext}
            className="absolute right-4 text-amber-light/60 hover:text-white p-2 rounded-lg hover:bg-earth-mid/30 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-9 w-9" />
          </button>
        </div>
      )}
    </>
  );
}

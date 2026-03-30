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
            className="relative aspect-square rounded-lg overflow-hidden group"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            aria-label="Close modal"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={goPrev}
            className="absolute left-4 text-white hover:text-gray-300"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <div className="max-w-4xl max-h-full">
            <img
              src={photos[selectedIndex].url}
              alt={photos[selectedIndex].caption}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-4">
              {photos[selectedIndex].caption}
            </p>
            <p className="text-gray-400 text-center text-sm mt-1">
              {familyPseudonym} - Photo {selectedIndex + 1} of {photos.length}
            </p>
          </div>

          <button
            onClick={goNext}
            className="absolute right-4 text-white hover:text-gray-300"
            aria-label="Next photo"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </div>
      )}
    </>
  );
}

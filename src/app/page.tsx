'use client';

import { useState, useEffect } from 'react';
import { Hero } from '@/components/Hero';
import { Gallery } from '@/components/Gallery';
import { useActiveOccasion } from '@/templates/activeOccasion';
import type { OccasionKey } from '@/templates/types';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { occasionKey, hydrated } = useActiveOccasion();
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionKey | null>(null);

  // Initialize selectedOccasion to the site's active occasion once hydrated
  useEffect(() => {
    if (hydrated) {
      setSelectedOccasion(occasionKey === 'general' ? null : occasionKey);
    }
  }, [occasionKey, hydrated]);

  return (
    <div className="page-enter">
      <Hero selectedOccasionKey={selectedOccasion || undefined} />
      <Gallery
        selectedOccasion={selectedOccasion}
        setSelectedOccasion={setSelectedOccasion}
      />
    </div>
  );
}

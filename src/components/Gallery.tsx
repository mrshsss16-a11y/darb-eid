'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTemplates } from '@/templates/store';
import { useActiveOccasion } from '@/templates/activeOccasion';
import { TemplateCard } from './TemplateCard';
import { OccasionFilter } from './OccasionFilter';
import type { OccasionKey } from '@/templates/types';

interface GalleryProps {
  selectedOccasion: OccasionKey | null;
  setSelectedOccasion: (v: OccasionKey | null) => void;
}

export function Gallery({ selectedOccasion, setSelectedOccasion }: GalleryProps) {
  const { templates } = useTemplates();
  const { occasionKey: activeKey, hydrated } = useActiveOccasion();
  const [userTouched, setUserTouched] = useState(false);

  // When the active site occasion changes (and the user hasn't manually
  // picked a filter yet), default the filter to it. "general" still shows all.
  useEffect(() => {
    if (!hydrated || userTouched) return;
    setSelectedOccasion(activeKey === 'general' ? null : activeKey);
  }, [activeKey, hydrated, userTouched, setSelectedOccasion]);

  const handleChange = (v: OccasionKey | null) => {
    setUserTouched(true);
    setSelectedOccasion(v);
  };

  // Per-occasion counts for the chip labels.
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: templates.length };
    for (const t of templates) {
      if (t.occasionKey) map[t.occasionKey] = (map[t.occasionKey] ?? 0) + 1;
    }
    return map;
  }, [templates]);

  const filtered = useMemo(() => {
    if (!selectedOccasion) return templates;
    return templates.filter((t) => t.occasionKey === selectedOccasion);
  }, [templates, selectedOccasion]);

  return (
    <section id="gallery" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-ink-50">
            معرض القوالب
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            اختر مناسبة، ثم القالب المناسب
          </p>
        </div>
        <span className="hidden sm:inline-flex label-tag">
          {filtered.length} من {templates.length} قالب
        </span>
      </div>

      <OccasionFilter
        value={selectedOccasion}
        onChange={handleChange}
        counts={counts}
      />

      {filtered.length === 0 ? (
        <div className="mt-8 text-center py-16 card-surface">
          <p className="text-ink-500 dark:text-ink-400">
            لا توجد قوالب لهذه المناسبة بعد. اطلب من الإدارة إضافة قوالب جديدة.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filtered.map((t, i) => (
            <TemplateCard key={t.id} template={t} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

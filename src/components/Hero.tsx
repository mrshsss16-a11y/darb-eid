'use client';

import { motion } from 'framer-motion';
import { Sparkles, MoveDown } from 'lucide-react';
import { useActiveOccasion } from '@/templates/activeOccasion';
import { useHeroOverrides } from '@/templates/heroCustomization';
import type { OccasionKey } from '@/templates/types';

interface HeroProps {
  selectedOccasionKey?: OccasionKey;
}

function getContrastText(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF';
  const hex = hexColor.substring(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 180 ? '#0E0E10' : '#FFFFFF';
}

export function Hero({ selectedOccasionKey }: HeroProps) {
  const { occasionKey: activeKey } = useActiveOccasion();
  const { getResolved } = useHeroOverrides();
  const resolvedKey = selectedOccasionKey ?? activeKey;
  const h = getResolved(resolvedKey);

  return (
    <section className="relative overflow-hidden">
      {/* Optional background image — sits behind everything with a tinted
          overlay so the hero text stays readable. */}
      {h.bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={h.bgImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: h.bgOverlayColor, opacity: h.bgOverlayOpacity }}
          />
        </>
      )}

      {/* Decorative orbs */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
        style={{ background: h.orbA + '66' }}
      />
      <div
        className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none transition-colors duration-700"
        style={{ background: h.orbB + '4D' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10 sm:pb-16">
        <motion.div
          key={`${resolvedKey}-${h.title}-${h.subtitle}-${h.color}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 transition-colors duration-500"
            style={{ background: h.bg, color: h.color }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{h.eyebrow}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-ink-900 dark:text-ink-50">
            {h.title}{' '}
            <span style={{ color: h.color }} className="transition-colors duration-500">
              {h.titleAccent}
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg lg:text-xl text-ink-600 dark:text-ink-300 max-w-2xl leading-relaxed whitespace-pre-line">
            {h.subtitle}
          </p>

          <div className="mt-8 flex items-center gap-3">
            <a
              href="#gallery"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 active:scale-[0.98]"
              style={{
                background: h.color,
                color: getContrastText(h.color),
                boxShadow: `0 20px 60px -20px ${h.color}88`,
              }}
            >
              <Sparkles className="h-5 w-5" />
              <span>{h.cta}</span>
            </a>
            <a
              href="#gallery"
              className="hidden sm:inline-flex items-center gap-2 text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50 transition-colors font-medium"
            >
              <MoveDown className="h-4 w-4 animate-bounce" />
              <span>اعرض الكل</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { OCCASIONS, getOccasion, type OccasionKey, type OccasionMeta } from './types';
import { supabase } from '@/utils/supabaseClient';

/**
 * Per-occasion hero customisation.
 *
 * Persisted in Supabase with automatic migration from localStorage on first run.
 * Falls back to localStorage if Supabase is offline or not configured.
 */

export interface HeroOverride {
  eyebrow?: string;
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  cta?: string;
  color?: string;
  orbA?: string;
  orbB?: string;
  bg?: string; // chip background tint

  /** Optional background image (compressed JPEG data URL). When set, the hero
   *  renders it full-bleed behind the content with a tinted overlay. */
  bgImage?: string;
  /** Overlay tint colour over the image (defaults to white). */
  bgOverlayColor?: string;
  /** Overlay opacity 0–1 (defaults to 0.7) — higher = less of the image shows
   *  through, more readable text. */
  bgOverlayOpacity?: number;
}

type Overrides = Partial<Record<OccasionKey, HeroOverride>>;

/**
 * Resolved hero settings = preset merged with the admin override.
 * Use this on the public site to render the actual hero.
 */
export interface ResolvedHero {
  occasion: OccasionMeta;
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  cta: string;
  color: string;
  orbA: string;
  orbB: string;
  bg: string;
  bgImage?: string;
  bgOverlayColor: string;
  bgOverlayOpacity: number;
}

export function resolveHero(key: OccasionKey, override: HeroOverride | undefined): ResolvedHero {
  const o = getOccasion(key);
  const h = o.hero;
  return {
    occasion: o,
    eyebrow: override?.eyebrow ?? h.eyebrow,
    title: override?.title ?? h.title,
    titleAccent: override?.titleAccent ?? h.titleAccent,
    subtitle: override?.subtitle ?? h.subtitle,
    cta: override?.cta ?? h.cta,
    color: override?.color ?? o.color,
    orbA: override?.orbA ?? o.orbColors[0],
    orbB: override?.orbB ?? o.orbColors[1],
    bg: override?.bg ?? o.bg,
    bgImage: override?.bgImage,
    bgOverlayColor: override?.bgOverlayColor ?? '#FFFFFF',
    bgOverlayOpacity: override?.bgOverlayOpacity ?? 0.7,
  };
}

export function useHeroOverrides() {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadHero() {
      try {
        const { data, error } = await supabase
          .from('hero_overrides')
          .select('*');

        if (!active) return;

        if (data && !error) {
          console.log('[heroCustomization] loadHero: loaded', data.length, 'rows from Supabase');
          const parsed: Overrides = {};
          data.forEach((row) => {
            parsed[row.occasion_key as OccasionKey] = {
              eyebrow: row.eyebrow === null ? undefined : row.eyebrow,
              title: row.title === null ? undefined : row.title,
              titleAccent: row.title_accent === null ? undefined : row.title_accent,
              subtitle: row.subtitle === null ? undefined : row.subtitle,
              cta: row.cta === null ? undefined : row.cta,
              color: row.color === null ? undefined : row.color,
              orbA: row.orb_a === null ? undefined : row.orb_a,
              orbB: row.orb_b === null ? undefined : row.orb_b,
              bg: row.bg === null ? undefined : row.bg,
              bgImage: row.bg_image === null ? undefined : row.bg_image,
              bgOverlayColor: row.bg_overlay_color === null ? undefined : row.bg_overlay_color,
              bgOverlayOpacity: row.bg_overlay_opacity !== null ? Number(row.bg_overlay_opacity) : undefined,
            };
          });
          setOverrides(parsed);
        } else {
          setOverrides({});
        }
      } catch (err) {
        console.error('Failed to load hero overrides from Supabase:', err);
        if (active) setOverrides({});
      } finally {
        if (active) setHydrated(true);
      }
    }

    loadHero();

    // Subscribe to hero_overrides changes in Supabase
    const channel = supabase
      .channel('hero-overrides-realtime-' + Math.random().toString(36).substring(2, 9))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_overrides' },
        () => {
          loadHero();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const setOverride = useCallback(
    async (key: OccasionKey, patch: Partial<HeroOverride>): Promise<{ ok: boolean; error?: string }> => {
      console.log('[heroCustomization] setOverride called', { key, patchKeys: Object.keys(patch).filter(k => (patch as Record<string, unknown>)[k] !== undefined) });
      
      const isDeleted = Object.values(patch).every((v) => v === undefined || v === '');

      setOverrides((prev) => {
        const merged: Overrides = {
          ...prev,
        };
        if (isDeleted) {
          delete merged[key];
        } else {
          merged[key] = patch;
        }
        return merged;
      });

      // Sync with Supabase
      try {
        if (isDeleted) {
          const { error } = await supabase
            .from('hero_overrides')
            .delete()
            .eq('occasion_key', key);
          if (error) {
            console.error('Supabase delete hero override error:', error);
            return { ok: false, error: error.message };
          }
        } else {
          const { error } = await supabase
            .from('hero_overrides')
            .upsert({
              occasion_key: key,
              eyebrow: patch.eyebrow === undefined ? null : patch.eyebrow,
              title: patch.title === undefined ? null : patch.title,
              title_accent: patch.titleAccent === undefined ? null : patch.titleAccent,
              subtitle: patch.subtitle === undefined ? null : patch.subtitle,
              cta: patch.cta === undefined ? null : patch.cta,
              color: patch.color === undefined ? null : patch.color,
              orb_a: patch.orbA === undefined ? null : patch.orbA,
              orb_b: patch.orbB === undefined ? null : patch.orbB,
              bg: patch.bg === undefined ? null : patch.bg,
              bg_image: patch.bgImage === undefined ? null : patch.bgImage,
              bg_overlay_color: patch.bgOverlayColor === undefined ? null : patch.bgOverlayColor,
              bg_overlay_opacity: patch.bgOverlayOpacity === undefined ? null : patch.bgOverlayOpacity,
            });
          if (error) {
            console.error('Supabase upsert hero override error:', error);
            return { ok: false, error: error.message };
          }
        }
        console.log('[heroCustomization] Supabase upsert SUCCESS for', key);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to save hero override to Supabase:', err);
        return { ok: false, error: msg };
      }
    },
    [],
  );

  const resetOccasion = useCallback(async (key: OccasionKey): Promise<{ ok: boolean; error?: string }> => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    // Sync with Supabase
    try {
      const { error } = await supabase
        .from('hero_overrides')
        .delete()
        .eq('occasion_key', key);
      if (error) {
        console.error('Supabase delete hero override error:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete hero override from Supabase:', err);
      return { ok: false, error: msg };
    }
  }, []);

  const resetAll = useCallback(async () => {
    setOverrides({});

    // Sync with Supabase
    try {
      await supabase
        .from('hero_overrides')
        .delete()
        .neq('occasion_key', '');
    } catch (err) {
      console.error('Failed to clear hero overrides in Supabase:', err);
    }
  }, []);

  /** Read the resolved hero for a single occasion (preset + override merged). */
  const getResolved = useCallback(
    (key: OccasionKey): ResolvedHero => resolveHero(key, overrides[key]),
    [overrides],
  );

  return {
    overrides,
    hydrated,
    setOverride,
    resetOccasion,
    resetAll,
    getResolved,
  };
}

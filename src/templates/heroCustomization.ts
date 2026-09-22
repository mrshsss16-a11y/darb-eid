'use client';

import { useCallback, useEffect, useState } from 'react';
import { OCCASIONS, getOccasion, type OccasionKey, type OccasionMeta } from './types';
import {
  supabase,
  isSupabaseConfigured,
  subscribeToTables,
  describeSupabaseError,
} from '@/utils/supabaseClient';
import { useTheme } from '@/components/ThemeProvider';
import { secureAdminWrite } from '@/utils/adminDbClient';

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

export function resolveHero(
  key: OccasionKey,
  override: HeroOverride | undefined,
  isDark?: boolean
): ResolvedHero {
  const o = getOccasion(key);
  const h = o.hero;

  const overrideColor = override?.color;
  const isDefaultColor = !overrideColor || overrideColor === o.color;
  const defaultColor = isDefaultColor
    ? (isDark && o.darkColor ? o.darkColor : o.color)
    : overrideColor!;

  const overrideBg = override?.bg;
  const isDefaultBg = !overrideBg || overrideBg === o.bg;
  const defaultBg = isDefaultBg
    ? (isDark && o.darkBg ? o.darkBg : o.bg)
    : overrideBg!;

  return {
    occasion: o,
    eyebrow: override?.eyebrow ?? h.eyebrow,
    title: override?.title ?? h.title,
    titleAccent: override?.titleAccent ?? h.titleAccent,
    subtitle: override?.subtitle ?? h.subtitle,
    cta: override?.cta ?? h.cta,
    color: defaultColor,
    orbA: override?.orbA ?? o.orbColors[0],
    orbB: override?.orbB ?? o.orbColors[1],
    bg: defaultBg,
    bgImage: override?.bgImage,
    bgOverlayColor: override?.bgOverlayColor ?? (isDark ? '#0E0E10' : '#FFFFFF'),
    bgOverlayOpacity: override?.bgOverlayOpacity ?? 0.7,
  };
}

const HERO_STORAGE_KEY = 'darb-hero-overrides';

function loadLocalHeroOverrides(): Overrides {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HERO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

/** Don't cache more than this in localStorage (bg images can be multi-MB). */
const MAX_LOCAL_CACHE_BYTES = 1_000_000;

function saveLocalHeroOverrides(o: Overrides) {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(o);
    if (json.length > MAX_LOCAL_CACHE_BYTES) {
      window.localStorage.removeItem(HERO_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(HERO_STORAGE_KEY, json);
  } catch (err) {
    console.warn('[heroCustomization] localStorage cache write skipped:', err);
  }
}

interface HeroRow {
  occasion_key: string;
  eyebrow: string | null;
  title: string | null;
  title_accent: string | null;
  subtitle: string | null;
  cta: string | null;
  color: string | null;
  orb_a: string | null;
  orb_b: string | null;
  bg: string | null;
  bg_image: string | null;
  bg_overlay_color: string | null;
  bg_overlay_opacity: number | string | null;
}

function heroOverrideToRow(key: string, o: HeroOverride): HeroRow {
  return {
    occasion_key: key,
    eyebrow: o.eyebrow ?? null,
    title: o.title ?? null,
    title_accent: o.titleAccent ?? null,
    subtitle: o.subtitle ?? null,
    cta: o.cta ?? null,
    color: o.color ?? null,
    orb_a: o.orbA ?? null,
    orb_b: o.orbB ?? null,
    bg: o.bg ?? null,
    bg_image: o.bgImage ?? null,
    bg_overlay_color: o.bgOverlayColor ?? null,
    bg_overlay_opacity: o.bgOverlayOpacity ?? null,
  };
}

function heroRowToOverride(row: HeroRow): HeroOverride {
  return {
    eyebrow: row.eyebrow ?? undefined,
    title: row.title ?? undefined,
    titleAccent: row.title_accent ?? undefined,
    subtitle: row.subtitle ?? undefined,
    cta: row.cta ?? undefined,
    color: row.color ?? undefined,
    orbA: row.orb_a ?? undefined,
    orbB: row.orb_b ?? undefined,
    bg: row.bg ?? undefined,
    bgImage: row.bg_image ?? undefined,
    bgOverlayColor: row.bg_overlay_color ?? undefined,
    bgOverlayOpacity:
      row.bg_overlay_opacity === null || row.bg_overlay_opacity === undefined
        ? undefined
        : Number(row.bg_overlay_opacity),
  };
}

export interface UseHeroOverridesOptions {
  /** Only admin components pass true — enables the one-off local→Supabase migration. */
  isAdmin?: boolean;
}

export function useHeroOverrides(opts?: UseHeroOverridesOptions) {
  const isAdmin = !!opts?.isAdmin;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [overrides, setOverrides] = useState<Overrides>({});
  const [hydrated, setHydrated] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHero() {
      const localOverrides = loadLocalHeroOverrides();

      if (!isSupabaseConfigured) {
        if (!active) return;
        setOverrides(localOverrides);
        setError('Supabase is not configured');
        setHydrated(true);
        return;
      }

      try {
        const { data, error: qErr } = await supabase
          .from('hero_overrides')
          .select('*')
          .order('occasion_key', { ascending: true });

        if (!active) return;
        if (qErr) throw new Error(describeSupabaseError(qErr));

        const rows = (data ?? []) as unknown as HeroRow[];
        const parsed: Overrides = {};
        rows.forEach((row) => {
          parsed[row.occasion_key as OccasionKey] = heroRowToOverride(row);
        });

        // One-off legacy migration — admin tabs only, fully isolated so a
        // failure can never hide what Supabase actually returned.
        if (isAdmin && rows.length === 0 && Object.keys(localOverrides).length > 0) {
          try {
            await secureAdminWrite(
              'hero_overrides',
              'insert',
              Object.entries(localOverrides).map(([k, o]) => heroOverrideToRow(k, o!)),
            );
            if (!active) return;
            Object.assign(parsed, localOverrides);
            console.info('[heroCustomization] migrated local hero overrides to Supabase');
          } catch (err) {
            console.error('[heroCustomization] local→Supabase migration failed:', err);
          }
        }

        setOverrides(parsed);
        setError(null);
        saveLocalHeroOverrides(parsed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[heroCustomization] failed to load hero overrides from Supabase, using local cache:', msg);
        if (active) {
          setOverrides(localOverrides);
          setError(msg);
        }
      } finally {
        if (active) setHydrated(true);
      }
    }

    void loadHero();

    // Shared, debounced realtime subscription (one channel for all instances).
    const unsubscribe = subscribeToTables(['hero_overrides'], () => {
      void loadHero();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isAdmin]);

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
          merged[key] = {
            ...prev[key],
            ...patch,
          };
        }
        saveLocalHeroOverrides(merged);
        return merged;
      });

      // Sync with Supabase
      try {
        if (isDeleted) {
          await secureAdminWrite('hero_overrides', 'delete', undefined, { key: 'occasion_key', val: key });
        } else {
          await secureAdminWrite('hero_overrides', 'upsert', heroOverrideToRow(key, patch as HeroOverride));
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
      saveLocalHeroOverrides(next);
      return next;
    });

    // Sync with Supabase
    try {
      await secureAdminWrite('hero_overrides', 'delete', undefined, { key: 'occasion_key', val: key });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete hero override from Supabase:', err);
      return { ok: false, error: msg };
    }
  }, []);

  const resetAll = useCallback(async () => {
    saveLocalHeroOverrides({});
    setOverrides({});

    // Sync with Supabase
    try {
      await secureAdminWrite('hero_overrides', 'delete', undefined, { key: 'occasion_key', val: '', operator: 'neq' });
    } catch (err) {
      console.error('Failed to clear hero overrides in Supabase:', err);
    }
  }, []);

  /** Read the resolved hero for a single occasion (preset + override merged). */
  const getResolved = useCallback(
    (key: OccasionKey): ResolvedHero => resolveHero(key, overrides[key], isDark),
    [overrides, isDark],
  );

  return {
    overrides,
    hydrated,
    /** Last load error (null when healthy). */
    error,
    setOverride,
    resetOccasion,
    resetAll,
    getResolved,
  };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { OCCASIONS, getOccasion, type OccasionKey, type OccasionMeta } from './types';
import { supabase, isSupabaseConfigured, subscribeToTables, describeSupabaseError } from '@/utils/supabaseClient';
import { secureAdminWrite } from '@/utils/adminDbClient';

/**
 * "Active occasion" = the current site-wide mood.
 *
 * Persisted in Supabase with automatic migration from localStorage on first run.
 * Falls back to localStorage if Supabase is offline or not configured.
 */

const DEFAULT_KEY: OccasionKey = 'general';

/**
 * Several components (Header, Hero, Gallery, admin) mount this hook at once.
 * Share one in-flight request and cache the result briefly so a page load
 * costs a single Supabase query instead of one per component.
 */
type OccasionResult = { data: { value: string } | null; error: any };
let occasionRequest: Promise<OccasionResult> | null = null;
let occasionFetchedAt = 0;
const OCCASION_CACHE_MS = 5000;

function fetchActiveOccasion(force: boolean): Promise<OccasionResult> {
  const fresh = Date.now() - occasionFetchedAt < OCCASION_CACHE_MS;
  if (!force && occasionRequest && fresh) return occasionRequest;
  occasionFetchedAt = Date.now();
  const req: Promise<OccasionResult> = Promise.resolve(
    supabase.from('settings').select('value').eq('key', 'active_occasion').maybeSingle(),
  ).then((r) => ({ data: r.data as { value: string } | null, error: r.error }));
  occasionRequest = req;
  // Do not cache failures.
  req.then((r) => { if (r.error && occasionRequest === req) occasionFetchedAt = 0; });
  return req;
}

export function useActiveOccasion() {
  const [key, setKey] = useState<OccasionKey>(DEFAULT_KEY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadActive(force = false) {
      if (!isSupabaseConfigured) {
        if (active) setHydrated(true);
        return;
      }
      try {
        const { data, error } = await fetchActiveOccasion(force);

        if (!active) return;
        if (error) throw new Error(describeSupabaseError(error));

        const val = data?.value as OccasionKey | undefined;
        if (val && OCCASIONS.some((o) => o.key === val)) {
          setKey(val);
        }
      } catch (err) {
        console.error('[activeOccasion] failed to load active occasion from Supabase:', err);
      } finally {
        if (active) setHydrated(true);
      }
    }

    void loadActive();

    // Shared, debounced realtime subscription on `settings`.
    const unsubscribe = subscribeToTables(['settings'], () => {
      void loadActive(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const setActive = useCallback(async (next: OccasionKey) => {
    setKey(next);

    // Sync with Supabase
    try {
      await secureAdminWrite('settings', 'upsert', { key: 'active_occasion', value: next });
    } catch (err) {
      console.error('Failed to save active occasion to Supabase:', err);
    }
  }, []);

  const meta: OccasionMeta = getOccasion(key);
  return { occasionKey: key, occasion: meta, setActive, hydrated };
}

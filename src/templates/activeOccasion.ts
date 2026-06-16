'use client';

import { useCallback, useEffect, useState } from 'react';
import { OCCASIONS, getOccasion, type OccasionKey, type OccasionMeta } from './types';
import { supabase } from '@/utils/supabaseClient';
import { secureAdminWrite } from '@/utils/adminDbClient';

/**
 * "Active occasion" = the current site-wide mood.
 *
 * Persisted in Supabase with automatic migration from localStorage on first run.
 * Falls back to localStorage if Supabase is offline or not configured.
 */

const DEFAULT_KEY: OccasionKey = 'general';

export function useActiveOccasion() {
  const [key, setKey] = useState<OccasionKey>(DEFAULT_KEY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadActive() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'active_occasion')
          .single();

        if (!active) return;

        if (data && data.value) {
          const val = data.value as OccasionKey;
          if (OCCASIONS.some((o) => o.key === val)) {
            setKey(val);
          }
        }
      } catch (err) {
        console.error('Failed to load active occasion from Supabase:', err);
      } finally {
        if (active) setHydrated(true);
      }
    }

    loadActive();

    // Subscribe to settings changes in Supabase
    const channel = supabase
      .channel('active-occasion-realtime-' + Math.random().toString(36).substring(2, 9))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          if (payload.new && (payload.new as any).key === 'active_occasion') {
            const val = (payload.new as any).value as OccasionKey;
            if (OCCASIONS.some((o) => o.key === val)) {
              setKey(val);
            }
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
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

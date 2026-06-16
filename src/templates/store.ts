'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Template, StoredTemplate, NameStyle } from './types';
import { seedTemplates, BUILTIN_DESIGNS } from './seed';
import { supabase } from '@/utils/supabaseClient';
import { secureAdminWrite } from '@/utils/adminDbClient';

/**
 * Template store.
 *
 * Reads templates and template overrides from Supabase, with an automatic migration
 * from localStorage on first run to ensure no existing user data is lost.
 *
 * Falls back gracefully to localStorage if Supabase is offline or if tables
 * haven't been created yet.
 */

const STORAGE_KEY = 'darb-templates';
const OVERRIDES_KEY = 'darb-overrides';

interface Override {
  title?: string;
  defaultNameStyle?: NameStyle;
  /** True → seed template is hidden from the public gallery / editor list. */
  hidden?: boolean;
}
type Overrides = Record<string, Override>;

export class StorageQuotaError extends Error {
  constructor() {
    super('STORAGE_QUOTA_EXCEEDED');
    this.name = 'StorageQuotaError';
  }
}

function loadStored(): StoredTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTemplate[]) : [];
  } catch {
    return [];
  }
}

function loadOverrides(): Overrides {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function saveStored(items: StoredTemplate[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function saveOverrides(o: Overrides) {
  try {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
  } catch {}
}

/** Resolve a stored template back into a live Template (with renderer). */
function resolveStored(s: StoredTemplate): Template {
  if (s.source.kind === 'seed') {
    const Design = BUILTIN_DESIGNS[s.source.key];
    return {
      id: s.id,
      title: s.title,
      occasion: s.occasion,
      occasionKey: s.occasionKey,
      palette: s.palette,
      defaultNameStyle: s.defaultNameStyle,
      renderArtwork: Design ?? seedTemplates[0].renderArtwork,
    };
  }
  return {
    id: s.id,
    title: s.title,
    occasion: s.occasion,
    occasionKey: s.occasionKey,
    palette: s.palette,
    defaultNameStyle: s.defaultNameStyle,
    renderArtwork: () => null,
    customImage: s.source.imageDataUrl,
    customImages: s.source.images,
  };
}

export function useTemplates(opts?: { includeHidden?: boolean }) {
  const includeHidden = !!opts?.includeHidden;

  const [overrides, setOverrides] = useState<Overrides>({});
  const [storedExtra, setStoredExtra] = useState<StoredTemplate[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const { data: tData, error: tErr } = await supabase
          .from('templates')
          .select('*');
        
        const { data: oData, error: oErr } = await supabase
          .from('overrides')
          .select('*');

        if (!active) return;

        const localStored = loadStored();
        let parsedStored: StoredTemplate[] = [];

        if (tData && !tErr) {
          // If Supabase is empty but localStorage has templates, migrate them
          if (tData.length === 0 && localStored.length > 0) {
            const toInsert = localStored.map((item) => ({
              id: item.id,
              title: item.title,
              occasion: item.occasion,
              occasion_key: item.occasionKey || null,
              palette: item.palette,
              default_name_style: item.defaultNameStyle,
              source: item.source,
            }));
            await secureAdminWrite('templates', 'insert', toInsert);
            parsedStored = localStored;
          } else {
            parsedStored = tData.map((row) => ({
              id: row.id,
              title: row.title,
              occasion: row.occasion,
              occasionKey: row.occasion_key,
              palette: row.palette,
              defaultNameStyle: row.default_name_style,
              source: row.source,
            }));
            // Sync to local storage
            saveStored(parsedStored);
          }
          setStoredExtra(parsedStored);
        } else {
          setStoredExtra(localStored);
        }

        const localOverrides = loadOverrides();
        if (oData && !oErr) {
          // If Supabase is empty but localStorage has overrides, migrate them
          if (oData.length === 0 && Object.keys(localOverrides).length > 0) {
            const toInsert = Object.entries(localOverrides).map(([id, o]) => ({
              id,
              title: o.title || null,
              default_name_style: o.defaultNameStyle || null,
              hidden: o.hidden || false,
            }));
            await secureAdminWrite('overrides', 'insert', toInsert);
            setOverrides(localOverrides);
          } else {
            const parsedOverrides: Overrides = {};
            oData.forEach((row) => {
              parsedOverrides[row.id] = {
                title: row.title,
                defaultNameStyle: row.default_name_style,
                hidden: row.hidden,
              };
            });
            setOverrides(parsedOverrides);
            // Sync to local storage
            saveOverrides(parsedOverrides);
          }
        } else {
          setOverrides(localOverrides);
        }
      } catch (err) {
        console.error('Error loading templates/overrides from Supabase:', err);
        if (active) {
          setStoredExtra(loadStored());
          setOverrides(loadOverrides());
        }
      } finally {
        if (active) setReady(true);
      }
    }

    loadData();

    // Subscribe to templates & overrides changes in Supabase
    const channel = supabase
      .channel('templates-overrides-realtime-' + Math.random().toString(36).substring(2, 9))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templates' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'overrides' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Merge seed + overrides + extras; tag each item with isHidden for the admin UI.
  const allTemplates: (Template & { isHidden: boolean; isSeed: boolean })[] = useMemo(() => {
    const fromSeed = seedTemplates.map((t) => {
      const o = overrides[t.id];
      return {
        ...t,
        title: o?.title ?? t.title,
        defaultNameStyle: o?.defaultNameStyle ?? t.defaultNameStyle,
        isHidden: !!o?.hidden,
        isSeed: true,
      };
    });
    const fromExtra = storedExtra.map((s) => ({
      ...resolveStored(s),
      isHidden: false,
      isSeed: false,
    }));
    return [...fromSeed, ...fromExtra];
  }, [overrides, storedExtra]);

  const templates = useMemo(
    () => (includeHidden ? allTemplates : allTemplates.filter((t) => !t.isHidden)),
    [allTemplates, includeHidden],
  );

  const upsertOverride = useCallback(
    async (id: string, patch: Override) => {
      const seedExists = seedTemplates.some((t) => t.id === id);

      if (seedExists) {
        const currentOverride = overrides[id] || {};
        const nextOverride = { ...currentOverride, ...patch };

        setOverrides((prev) => {
          const next = { ...prev, [id]: nextOverride };
          saveOverrides(next);
          return next;
        });

        // Sync with Supabase overrides table
        try {
          await secureAdminWrite('overrides', 'upsert', {
            id,
            title: nextOverride.title ?? null,
            default_name_style: nextOverride.defaultNameStyle ?? null,
            hidden: nextOverride.hidden ?? false,
          });
        } catch (err) {
          console.error('Failed to save override to Supabase:', err);
        }
      } else {
        // It's a custom template, update templates table
        setStoredExtra((prev) => {
          const i = prev.findIndex((t) => t.id === id);
          if (i === -1) return prev;
          const next = [...prev];
          next[i] = {
            ...next[i],
            title: patch.title ?? next[i].title,
            defaultNameStyle: patch.defaultNameStyle ?? next[i].defaultNameStyle,
          };
          saveStored(next);
          return next;
        });

        // Sync with Supabase templates table
        try {
          await secureAdminWrite('templates', 'update', {
            title: patch.title,
            default_name_style: patch.defaultNameStyle,
          }, { key: 'id', val: id });
        } catch (err) {
          console.error('Failed to update custom template in Supabase:', err);
        }
      }
    },
    [overrides],
  );

  const addCustomTemplate = useCallback(async (item: StoredTemplate) => {
    const next = [...storedExtra, item];
    saveStored(next);
    setStoredExtra(next);

    // Sync with Supabase
    try {
      await secureAdminWrite('templates', 'insert', {
        id: item.id,
        title: item.title,
        occasion: item.occasion,
        occasion_key: item.occasionKey || null,
        palette: item.palette,
        default_name_style: item.defaultNameStyle,
        source: item.source,
      });
    } catch (err) {
      console.error('Failed to add custom template to Supabase:', err);
    }
    return item;
  }, [storedExtra]);

  const deleteTemplate = useCallback(async (id: string) => {
    const isSeed = seedTemplates.some((t) => t.id === id);
    if (isSeed) {
      const currentOverride = overrides[id] || {};
      setOverrides((prev) => {
        const next = { ...prev, [id]: { ...prev[id], hidden: true } };
        saveOverrides(next);
        return next;
      });

      // Sync with Supabase
      try {
        await secureAdminWrite('overrides', 'upsert', {
          id,
          title: currentOverride.title ?? null,
          default_name_style: currentOverride.defaultNameStyle ?? null,
          hidden: true,
        });
      } catch (err) {
        console.error('Failed to sync hidden override to Supabase:', err);
      }
    } else {
      setStoredExtra((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveStored(next);
        return next;
      });

      // Sync with Supabase
      try {
        await secureAdminWrite('templates', 'delete', undefined, { key: 'id', val: id });
      } catch (err) {
        console.error('Failed to delete custom template from Supabase:', err);
      }
    }
  }, [overrides]);

  const restoreTemplate = useCallback(async (id: string) => {
    const currentOverride = overrides[id] || {};
    setOverrides((prev) => {
      if (!prev[id]?.hidden) return prev;
      const next = { ...prev, [id]: { ...prev[id], hidden: false } };
      saveOverrides(next);
      return next;
    });

    // Sync with Supabase
    try {
      await secureAdminWrite('overrides', 'upsert', {
        id,
        title: currentOverride.title ?? null,
        default_name_style: currentOverride.defaultNameStyle ?? null,
        hidden: false,
      });
    } catch (err) {
      console.error('Failed to restore override to Supabase:', err);
    }
  }, [overrides]);

  const resetAll = useCallback(async () => {
    saveOverrides({});
    saveStored([]);
    setOverrides({});
    setStoredExtra([]);

    // Sync with Supabase
    try {
      await secureAdminWrite('templates', 'delete', undefined, { key: 'id', val: '', operator: 'neq' });
      await secureAdminWrite('overrides', 'delete', undefined, { key: 'id', val: '', operator: 'neq' });
    } catch (err) {
      console.error('Failed to reset data in Supabase:', err);
    }
  }, []);

  return {
    templates,
    ready,
    upsertOverride,
    addCustomTemplate,
    deleteTemplate,
    restoreTemplate,
    resetAll,
  };
}

export function getSeedTemplate(id: string): Template | undefined {
  return seedTemplates.find((t) => t.id === id);
}

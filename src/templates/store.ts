'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Template, StoredTemplate, NameStyle } from './types';
import { seedTemplates, BUILTIN_DESIGNS } from './seed';
import {
  supabase,
  isSupabaseConfigured,
  subscribeToTables,
  describeSupabaseError,
} from '@/utils/supabaseClient';
import { secureAdminWrite } from '@/utils/adminDbClient';
import {
  TEMPLATE_COLUMNS,
  OVERRIDE_COLUMNS,
  templateRowToStored,
  storedToTemplateRow,
  overrideRowToOverride,
  overrideToRow,
  type TemplateRow,
  type OverrideRow,
  type TemplateOverride,
  type TemplateOverrides,
} from '@/utils/templateRows';

/**
 * Template store.
 *
 * Source of truth: Supabase (`templates` + `overrides` tables, public read
 * under RLS). All hook instances share ONE in-memory snapshot, ONE in-flight
 * fetch and ONE debounced realtime subscription, so mounting `useTemplates`
 * in the gallery, the editor and three admin panels costs a single query.
 *
 * localStorage is only a best-effort offline cache:
 *   - it is never allowed to fail the load (quota errors are swallowed),
 *   - large payloads (base64 images) are not cached at all,
 *   - it is only used when Supabase cannot be reached.
 *
 * A one-off migration of legacy localStorage templates into Supabase runs
 * only when a hook instance explicitly opts in with `isAdmin: true` (admin
 * components, after the session cookie was confirmed). Public pages never
 * call /api/admin/db.
 */

const STORAGE_KEY = 'darb-templates';
const OVERRIDES_KEY = 'darb-overrides';
/** Don't cache more than this in localStorage (browsers cap at ~5MB total). */
const MAX_LOCAL_CACHE_BYTES = 1_000_000;

export type Override = TemplateOverride;
type Overrides = TemplateOverrides;

/** Patch accepted by `upsertOverride` (custom templates may also swap `source`). */
export interface TemplatePatch extends TemplateOverride {
  source?: StoredTemplate['source'];
}

/**
 * Kept for backwards compatibility (AdminUploader catches it). The store no
 * longer throws this — cache writes are best-effort — but a future storage
 * backend might.
 */
export class StorageQuotaError extends Error {
  constructor() {
    super('STORAGE_QUOTA_EXCEEDED');
    this.name = 'StorageQuotaError';
  }
}

// ───────────────────────────────────────────────────────────────────────────
// localStorage cache (best-effort, never throws)
// ───────────────────────────────────────────────────────────────────────────

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(value);
    if (json.length > MAX_LOCAL_CACHE_BYTES) {
      // Too big to cache safely (would throw QuotaExceededError). Drop any
      // stale copy so we never serve outdated data from the cache.
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, json);
  } catch (err) {
    console.warn(`[templates/store] localStorage cache write skipped for "${key}":`, err);
  }
}

const loadStored = () => readLocal<StoredTemplate[]>(STORAGE_KEY, []);
const loadOverrides = () => readLocal<Overrides>(OVERRIDES_KEY, {});
const saveStored = (items: StoredTemplate[]) => writeLocal(STORAGE_KEY, items);
const saveOverrides = (o: Overrides) => writeLocal(OVERRIDES_KEY, o);

// ───────────────────────────────────────────────────────────────────────────
// Shared snapshot
// ───────────────────────────────────────────────────────────────────────────

interface Snapshot {
  stored: StoredTemplate[];
  overrides: Overrides;
  /** True once the first load attempt (success or failure) has finished. */
  ready: boolean;
  /** Last load error (Arabic-free, for logs/diagnostics), null when healthy. */
  error: string | null;
  /** 'supabase' when data came from the DB, 'local' when served from cache. */
  origin: 'none' | 'supabase' | 'local';
  lastLoadedAt: number | null;
}

const INITIAL_SNAPSHOT: Snapshot = {
  stored: [],
  overrides: {},
  ready: false,
  error: null,
  origin: 'none',
  lastLoadedAt: null,
};

let snapshot: Snapshot = INITIAL_SNAPSHOT;
const listeners = new Set<() => void>();

function setSnapshot(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => INITIAL_SNAPSHOT;

// ───────────────────────────────────────────────────────────────────────────
// Loading
// ───────────────────────────────────────────────────────────────────────────

let inflight: Promise<void> | null = null;
/** Set once an admin-gated migration pass has run in this page session. */
let migrationAttempted = false;

/** Migrate legacy localStorage data into an empty Supabase (admin tabs only). */
async function migrateLocalToSupabase(
  localStored: StoredTemplate[],
  localOverrides: Overrides,
  remoteTemplatesEmpty: boolean,
  remoteOverridesEmpty: boolean,
): Promise<{ templates: boolean; overrides: boolean }> {
  const result = { templates: false, overrides: false };

  if (remoteTemplatesEmpty && localStored.length > 0) {
    try {
      await secureAdminWrite('templates', 'insert', localStored.map(storedToTemplateRow));
      result.templates = true;
      console.info(`[templates/store] migrated ${localStored.length} local template(s) to Supabase`);
    } catch (err) {
      console.error('[templates/store] local→Supabase template migration failed:', err);
    }
  }

  if (remoteOverridesEmpty && Object.keys(localOverrides).length > 0) {
    try {
      await secureAdminWrite(
        'overrides',
        'insert',
        Object.entries(localOverrides).map(([id, o]) => overrideToRow(id, o)),
      );
      result.overrides = true;
      console.info('[templates/store] migrated local overrides to Supabase');
    } catch (err) {
      console.error('[templates/store] local→Supabase override migration failed:', err);
    }
  }

  return result;
}

async function loadFromSupabase(migrate: boolean): Promise<void> {
  if (typeof window === 'undefined') return;

  const localStored = loadStored();
  const localOverrides = loadOverrides();

  if (!isSupabaseConfigured) {
    setSnapshot({
      stored: localStored,
      overrides: localOverrides,
      ready: true,
      error: 'Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)',
      origin: 'local',
      lastLoadedAt: Date.now(),
    });
    return;
  }

  try {
    const [tRes, oRes] = await Promise.all([
      supabase
        .from('templates')
        .select(TEMPLATE_COLUMNS)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true }),
      supabase.from('overrides').select(OVERRIDE_COLUMNS).order('id', { ascending: true }),
    ]);

    if (tRes.error) throw new Error(`templates: ${describeSupabaseError(tRes.error)}`);
    if (oRes.error) throw new Error(`overrides: ${describeSupabaseError(oRes.error)}`);

    const tRows = (tRes.data ?? []) as unknown as TemplateRow[];
    const oRows = (oRes.data ?? []) as unknown as OverrideRow[];

    let stored = tRows.map(templateRowToStored).filter((t): t is StoredTemplate => t !== null);
    let overrides: Overrides = {};
    for (const row of oRows) overrides[row.id] = overrideRowToOverride(row);

    // One-off legacy migration — admin-only (explicit opt-in), isolated so it
    // can never discard remote data.
    if (
      migrate &&
      !migrationAttempted &&
      ((tRows.length === 0 && localStored.length > 0) ||
        (oRows.length === 0 && Object.keys(localOverrides).length > 0))
    ) {
      migrationAttempted = true;
      const migrated = await migrateLocalToSupabase(
        localStored,
        localOverrides,
        tRows.length === 0,
        oRows.length === 0,
      );
      if (migrated.templates) stored = localStored;
      if (migrated.overrides) overrides = localOverrides;
    }

    // Publish first, cache second: a cache failure must not hide the data.
    setSnapshot({
      stored,
      overrides,
      ready: true,
      error: null,
      origin: 'supabase',
      lastLoadedAt: Date.now(),
    });
    saveStored(stored);
    saveOverrides(overrides);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[templates/store] failed to load from Supabase, using local cache:', message);
    setSnapshot({
      // Keep whatever we already had from a previous successful load; otherwise
      // fall back to the local cache.
      stored: snapshot.origin === 'supabase' ? snapshot.stored : localStored,
      overrides: snapshot.origin === 'supabase' ? snapshot.overrides : localOverrides,
      ready: true,
      error: message,
      origin: snapshot.origin === 'supabase' ? 'supabase' : 'local',
      lastLoadedAt: Date.now(),
    });
  }
}

/**
 * Deduplicated refetch: concurrent callers share the same promise.
 * `migrate: true` (admin only) additionally runs the legacy localStorage →
 * Supabase migration once per page session.
 */
export function refreshTemplates(opts?: { migrate?: boolean }): Promise<void> {
  const migrate = !!opts?.migrate;
  if (inflight) {
    if (!migrate || migrationAttempted) return inflight;
    // A non-migrating load is running; queue one migrating pass after it.
    return inflight.then(() => refreshTemplates({ migrate: true }));
  }
  inflight = loadFromSupabase(migrate).finally(() => {
    inflight = null;
  });
  return inflight;
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

// ───────────────────────────────────────────────────────────────────────────
// Hook
// ───────────────────────────────────────────────────────────────────────────

export type GalleryTemplate = Template & { isHidden: boolean; isSeed: boolean };

export interface UseTemplatesOptions {
  includeHidden?: boolean;
  /**
   * Only admin components (behind AdminGate) pass true. Enables the one-off
   * localStorage → Supabase migration, which needs the admin session cookie.
   */
  isAdmin?: boolean;
}

export function useTemplates(opts?: UseTemplatesOptions) {
  const includeHidden = !!opts?.includeHidden;
  const isAdmin = !!opts?.isAdmin;
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { stored: storedExtra, overrides, ready, error, origin } = snap;

  useEffect(() => {
    // First mount (or a stale snapshot) triggers a load; other instances reuse it.
    // Admin instances also get one migration pass (no-op when nothing to migrate).
    if (!snapshot.ready || snapshot.origin !== 'supabase' || (isAdmin && !migrationAttempted)) {
      void refreshTemplates({ migrate: isAdmin });
    }

    const unsubRealtime = subscribeToTables(['templates', 'overrides'], () => {
      void refreshTemplates();
    });

    // Cheap safety net if realtime is unavailable: refetch when the tab
    // regains focus, at most once per 30s.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const last = snapshot.lastLoadedAt ?? 0;
      if (Date.now() - last > 30_000) void refreshTemplates();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      unsubRealtime();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAdmin]);

  // Merge seed + overrides + extras; tag each item with isHidden for the admin UI.
  const allTemplates: GalleryTemplate[] = useMemo(() => {
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

  const writeSeedOverride = useCallback(async (id: string, next: TemplateOverride) => {
    await secureAdminWrite('overrides', 'upsert', overrideToRow(id, next));
    const overridesNext = { ...snapshot.overrides, [id]: next };
    setSnapshot({ overrides: overridesNext });
    saveOverrides(overridesNext);
  }, []);

  const upsertOverride = useCallback(async (id: string, patch: TemplatePatch) => {
    const seedExists = seedTemplates.some((t) => t.id === id);

    if (seedExists) {
      // Seed templates: only title / name style / hidden live in `overrides`.
      // `source` is meaningless for a seed and is intentionally ignored.
      const { source: _ignored, ...overridePatch } = patch;
      const current = snapshot.overrides[id] ?? {};
      await writeSeedOverride(id, { ...current, ...overridePatch });
      return;
    }

    // Custom templates: update the row in `templates`.
    const updateData: Partial<TemplateRow> = {};
    if (patch.title !== undefined) updateData.title = patch.title;
    if (patch.defaultNameStyle !== undefined) updateData.default_name_style = patch.defaultNameStyle;
    if (patch.source !== undefined) updateData.source = patch.source;
    if (Object.keys(updateData).length === 0) return;

    await secureAdminWrite('templates', 'update', updateData, { key: 'id', val: id });

    const storedNext = snapshot.stored.map((t) =>
      t.id === id
        ? {
            ...t,
            title: patch.title ?? t.title,
            defaultNameStyle: patch.defaultNameStyle ?? t.defaultNameStyle,
            source: patch.source ?? t.source,
          }
        : t,
    );
    setSnapshot({ stored: storedNext });
    saveStored(storedNext);
  }, [writeSeedOverride]);

  const addCustomTemplate = useCallback(async (item: StoredTemplate) => {
    await secureAdminWrite('templates', 'insert', storedToTemplateRow(item));
    const storedNext = [...snapshot.stored.filter((t) => t.id !== item.id), item];
    setSnapshot({ stored: storedNext });
    saveStored(storedNext);
    return item;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    const isSeed = seedTemplates.some((t) => t.id === id);
    if (isSeed) {
      const current = snapshot.overrides[id] ?? {};
      await writeSeedOverride(id, { ...current, hidden: true });
      return;
    }
    await secureAdminWrite('templates', 'delete', undefined, { key: 'id', val: id });
    const storedNext = snapshot.stored.filter((t) => t.id !== id);
    setSnapshot({ stored: storedNext });
    saveStored(storedNext);
  }, [writeSeedOverride]);

  const restoreTemplate = useCallback(async (id: string) => {
    const current = snapshot.overrides[id] ?? {};
    if (!current.hidden) return;
    await writeSeedOverride(id, { ...current, hidden: false });
  }, [writeSeedOverride]);

  const resetAll = useCallback(async () => {
    // Remote first, so a failed reset doesn't leave the UI empty while the
    // database still has data.
    try {
      await secureAdminWrite('templates', 'delete', undefined, { key: 'id', val: '', operator: 'neq' });
      await secureAdminWrite('overrides', 'delete', undefined, { key: 'id', val: '', operator: 'neq' });
    } catch (err) {
      console.error('[templates/store] failed to reset data in Supabase:', err);
      throw err;
    }
    setSnapshot({ stored: [], overrides: {} });
    saveStored([]);
    saveOverrides({});
  }, []);

  return {
    templates,
    ready,
    /** Last load error message (null when the last load succeeded). */
    error,
    /** Where the current data came from: 'supabase' | 'local' | 'none'. */
    origin,
    refresh: () => refreshTemplates(),
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

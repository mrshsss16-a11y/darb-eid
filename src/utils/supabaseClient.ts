import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client (anon key, read-only under RLS).
 *
 * All writes go through `/api/admin/db` (service-role key, server-side).
 */

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

/**
 * True when both public env vars are present and look real. When false the
 * client below still exists (so imports don't crash) but every query will fail
 * and the app falls back to seed templates / local cache. Surface this in the
 * admin diagnostic UI so a misconfigured deployment is obvious.
 */
export const isSupabaseConfigured =
  /^https:\/\/.+\.supabase\.(co|in)$/i.test(envUrl) && envAnonKey.length > 20;

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing or invalid. ' +
      'Templates saved by the admin will NOT be loaded from the database. ' +
      'Set them in .env.local (see .env.example) and restart the dev server.',
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? envUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? envAnonKey : 'placeholder',
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 2 } },
  },
);

/** Human-readable description of a Supabase/PostgREST error for logs & UI. */
export function describeSupabaseError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  const e = err as { message?: string; details?: string; hint?: string; code?: string };
  return [e.code, e.message, e.details, e.hint].filter(Boolean).join(' — ') || String(err);
}

// ───────────────────────────────────────────────────────────────────────────
// Shared, refcounted realtime subscriptions.
//
// Every hook instance that wants to know about changes to a set of tables
// calls `subscribeToTables`. One channel per table-set is opened lazily and
// closed when the last subscriber leaves. Callbacks are debounced so a burst
// of row changes (e.g. a bulk insert) triggers a single refetch.
// ───────────────────────────────────────────────────────────────────────────

type Listener = () => void;

interface SharedChannel {
  channel: RealtimeChannel | null;
  listeners: Set<Listener>;
  timer: ReturnType<typeof setTimeout> | null;
}

const sharedChannels = new Map<string, SharedChannel>();

const REALTIME_DEBOUNCE_MS = 400;

export function subscribeToTables(tables: string[], onChange: Listener): () => void {
  if (typeof window === 'undefined' || !isSupabaseConfigured) {
    return () => {};
  }

  const key = [...tables].sort().join('+');
  let entry = sharedChannels.get(key);

  if (!entry) {
    entry = { channel: null, listeners: new Set(), timer: null };
    sharedChannels.set(key, entry);

    const e = entry;
    const fire = () => {
      if (e.timer) clearTimeout(e.timer);
      e.timer = setTimeout(() => {
        e.timer = null;
        e.listeners.forEach((l) => {
          try {
            l();
          } catch (err) {
            console.error('[supabaseClient] realtime listener threw:', err);
          }
        });
      }, REALTIME_DEBOUNCE_MS);
    };

    let channel = supabase.channel(`darb:${key}`);
    for (const table of tables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        fire,
      );
    }
    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(
          `[supabaseClient] realtime channel "${key}" ${status}. ` +
            'Live updates are disabled for this session; data still loads on page open/focus.',
          err ?? '',
        );
      }
    });
    entry.channel = channel;
  }

  entry.listeners.add(onChange);

  return () => {
    const cur = sharedChannels.get(key);
    if (!cur) return;
    cur.listeners.delete(onChange);
    if (cur.listeners.size === 0) {
      if (cur.timer) clearTimeout(cur.timer);
      if (cur.channel) {
        supabase.removeChannel(cur.channel).catch(() => {});
      }
      sharedChannels.delete(key);
    }
  };
}

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_COOKIE, verifySessionToken, isSameOriginRequest } from '@/utils/adminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/db — the ONLY write path to Supabase.
 *
 * Auth:     HMAC-signed HttpOnly session cookie (src/utils/adminSession.ts).
 * Payload:  { table, action, data?, query? }
 *   - table   ∈ ALLOWED_TABLES
 *   - action  ∈ upsert | insert | update | delete
 *   - data    object or array (≤ MAX_ROWS) whose keys are whitelisted per table
 *   - query   { key ∈ table's filterable columns, val: string|number|boolean|null, operator?: 'eq'|'neq' }
 *             'neq' is only honoured for delete with val === '' (the "reset all" path used by store.ts).
 * Limits:   body ≤ MAX_BODY_BYTES (6 MB) — note Vercel serverless caps request bodies
 *           at ~4.5 MB anyway, which is why large images must go to Storage (/api/admin/upload).
 */

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MAX_ROWS = 200;
const MAX_ID_LENGTH = 200;

type Table = 'settings' | 'templates' | 'overrides' | 'hero_overrides';
type Action = 'upsert' | 'insert' | 'update' | 'delete';

const ALLOWED_ACTIONS: readonly Action[] = ['upsert', 'insert', 'update', 'delete'];

/** Writable columns per table (mirrors supabase_schema.sql; timestamps are DB-managed). */
const COLUMNS: Record<Table, readonly string[]> = {
  settings: ['key', 'value'],
  templates: ['id', 'title', 'occasion', 'occasion_key', 'palette', 'default_name_style', 'source'],
  overrides: ['id', 'title', 'default_name_style', 'hidden', 'source'],
  hero_overrides: [
    'occasion_key',
    'eyebrow',
    'title',
    'title_accent',
    'subtitle',
    'cta',
    'color',
    'orb_a',
    'orb_b',
    'bg',
    'bg_image',
    'bg_overlay_color',
    'bg_overlay_opacity',
  ],
};

/** Columns allowed in `query.key` (primary keys only — prevents filter injection). */
const FILTER_KEYS: Record<Table, readonly string[]> = {
  settings: ['key'],
  templates: ['id'],
  overrides: ['id'],
  hero_overrides: ['occasion_key'],
};

const NO_STORE = { 'Cache-Control': 'no-store' };

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Strip unknown keys and enforce basic per-key sanity. Returns an error string or null. */
function sanitizeRow(table: Table, row: unknown, action: Action): { row?: Record<string, unknown>; error?: string } {
  if (!isPlainObject(row)) return { error: 'Each row must be an object.' };
  const allowed = COLUMNS[table];
  const clean: Record<string, unknown> = {};
  for (const k of Object.keys(row)) {
    if (!allowed.includes(k)) return { error: `Column '${k}' is not allowed on '${table}'.` };
    clean[k] = row[k];
  }
  if (Object.keys(clean).length === 0) return { error: 'Row has no writable columns.' };

  // Primary-key guards for full-row writes.
  const pk = FILTER_KEYS[table][0];
  if (action === 'insert' || action === 'upsert') {
    const id = clean[pk];
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_LENGTH) {
      return { error: `'${pk}' must be a non-empty string (≤ ${MAX_ID_LENGTH} chars).` };
    }
  } else if (pk in clean) {
    // Never allow re-keying a row through update.
    delete clean[pk];
    if (Object.keys(clean).length === 0) return { error: 'Nothing to update.' };
  }

  // Light type checks on well-known columns.
  if ('hidden' in clean && clean.hidden !== null && typeof clean.hidden !== 'boolean') {
    return { error: "'hidden' must be boolean." };
  }
  if ('bg_overlay_opacity' in clean && clean.bg_overlay_opacity !== null) {
    const n = clean.bg_overlay_opacity;
    if (typeof n !== 'number' || !Number.isFinite(n)) return { error: "'bg_overlay_opacity' must be a number." };
  }
  for (const textCol of ['title', 'occasion', 'occasion_key', 'value', 'eyebrow', 'subtitle', 'cta']) {
    if (textCol in clean && clean[textCol] !== null && typeof clean[textCol] !== 'string') {
      return { error: `'${textCol}' must be a string.` };
    }
  }
  return { row: clean };
}

function isScalar(v: unknown): v is string | number | boolean | null {
  return v === null || ['string', 'number', 'boolean'].includes(typeof v);
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate (signed session cookie) + same-origin check.
    const token = cookies().get(ADMIN_COOKIE)?.value;
    if (!(await verifySessionToken(token))) return bad('Unauthorized', 401);
    if (!isSameOriginRequest(req)) return bad('Forbidden', 403);

    // 2. Body size guard (Content-Length first, then the actual text).
    const declared = Number(req.headers.get('content-length') || 0);
    if (declared > MAX_BODY_BYTES) return bad('Payload too large', 413);
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return bad('Payload too large', 413);

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return bad('Invalid JSON');
    }
    if (!isPlainObject(body)) return bad('Body must be an object');

    const { table, action, data, query } = body as {
      table?: unknown;
      action?: unknown;
      data?: unknown;
      query?: unknown;
    };

    // 3. Validate table/action.
    if (typeof table !== 'string' || !(table in COLUMNS)) return bad('Table not allowed.');
    if (typeof action !== 'string' || !ALLOWED_ACTIONS.includes(action as Action)) return bad('Action not allowed.');
    const t = table as Table;
    const a = action as Action;

    // 4. Validate query (update/delete).
    let q: { key: string; val: string | number | boolean | null; operator: 'eq' | 'neq' } | null = null;
    if (a === 'update' || a === 'delete') {
      if (!isPlainObject(query)) return bad(`Missing query parameters for ${a}`);
      const { key, val, operator } = query;
      if (typeof key !== 'string' || !FILTER_KEYS[t].includes(key)) return bad('query.key not allowed.');
      if (!isScalar(val)) return bad('query.val must be a scalar.');
      if (typeof val === 'string' && val.length > MAX_ID_LENGTH) return bad('query.val too long.');
      const op = operator === undefined ? 'eq' : operator;
      if (op !== 'eq' && op !== 'neq') return bad('query.operator not allowed.');
      // 'neq' is the reset-all path: only for delete, only with the sentinel ''.
      if (op === 'neq' && (a !== 'delete' || val !== '')) return bad("'neq' is only allowed for delete with val ''.");
      q = { key, val, operator: op };
    }

    // 5. Validate data (insert/upsert/update).
    let rows: Record<string, unknown> | Record<string, unknown>[] | undefined;
    if (a !== 'delete') {
      if (Array.isArray(data)) {
        if (a === 'update') return bad('update expects a single object.');
        if (data.length === 0) return bad('data is empty.');
        if (data.length > MAX_ROWS) return bad(`Too many rows (max ${MAX_ROWS}).`);
        const out: Record<string, unknown>[] = [];
        for (const r of data) {
          const res = sanitizeRow(t, r, a);
          if (res.error) return bad(res.error);
          out.push(res.row!);
        }
        rows = out;
      } else {
        const res = sanitizeRow(t, data, a);
        if (res.error) return bad(res.error);
        rows = res.row!;
      }
    }

    // 6. Connect with the service-role key (server only; bypasses RLS).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error('[admin/db] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured.');
      return bad('Server configuration error', 500);
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const from = admin.from(t);

    // 7. Execute.
    let res: { error: { message: string } | null; data: unknown };
    if (a === 'upsert') {
      res = await from.upsert(rows as never);
    } else if (a === 'insert') {
      res = await from.insert(rows as never);
    } else if (a === 'update') {
      res = await from.update(rows as never).eq(q!.key, q!.val as never);
    } else {
      res =
        q!.operator === 'neq'
          ? await from.delete().neq(q!.key, q!.val as never)
          : await from.delete().eq(q!.key, q!.val as never);
    }

    if (res.error) {
      console.error(`[admin/db] Supabase error during ${a} on ${t}:`, res.error.message);
      return bad('Database operation failed', 500);
    }

    return NextResponse.json({ ok: true, data: res.data ?? null }, { headers: NO_STORE });
  } catch (err) {
    console.error('[admin/db] Unhandled error:', err);
    return bad('Internal Server Error', 500);
  }
}

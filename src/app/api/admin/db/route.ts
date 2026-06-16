import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_TABLES = ['settings', 'templates', 'overrides', 'hero_overrides'];
const ALLOWED_ACTIONS = ['upsert', 'insert', 'update', 'delete'];

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token')?.value;
    const expected = process.env.ADMIN_PASSWORD;

    // 1. Authenticate server-side
    if (!expected || !token || token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate request payload
    const body = await req.json();
    const { table, action, data, query } = body;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: `Table '${table}' not allowed.` }, { status: 400 });
    }
    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: `Action '${action}' not allowed.` }, { status: 400 });
    }

    // 3. Connect to Supabase using secret service role key (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[admin/db] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, serviceKey) as any;

    // 4. Perform the database operation
    let res;
    if (action === 'upsert') {
      res = await adminSupabase.from(table as any).upsert(data);
    } else if (action === 'insert') {
      res = await adminSupabase.from(table as any).insert(data);
    } else if (action === 'update') {
      if (!query || typeof query.key !== 'string') {
        return NextResponse.json({ error: 'Missing query parameters for update' }, { status: 400 });
      }
      res = await adminSupabase.from(table as any).update(data).eq(query.key, query.val);
    } else if (action === 'delete') {
      if (!query || typeof query.key !== 'string') {
        return NextResponse.json({ error: 'Missing query parameters for delete' }, { status: 400 });
      }
      if (query.operator === 'neq') {
        res = await adminSupabase.from(table as any).delete().neq(query.key, query.val);
      } else {
        res = await adminSupabase.from(table as any).delete().eq(query.key, query.val);
      }
    }

    if (res?.error) {
      console.error(`[admin/db] Supabase error during ${action} on ${table}:`, res.error);
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: res?.data });
  } catch (err) {
    console.error('[admin/db] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

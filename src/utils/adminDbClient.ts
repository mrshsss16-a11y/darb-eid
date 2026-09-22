/**
 * Client-side wrapper for the secure write gateway (POST /api/admin/db).
 * Auth is carried by the HttpOnly session cookie; nothing secret lives here.
 */

export type AdminTable = 'settings' | 'templates' | 'overrides' | 'hero_overrides';
export type AdminAction = 'upsert' | 'insert' | 'update' | 'delete';

export class AdminSessionExpiredError extends Error {
  constructor() {
    super('انتهت جلسة الإدارة. سجّل الدخول مرة أخرى.');
    this.name = 'AdminSessionExpiredError';
  }
}

export async function secureAdminWrite(
  table: AdminTable,
  action: AdminAction,
  data?: unknown,
  query?: { key: string; val: string | number | boolean | null; operator?: 'eq' | 'neq' },
) {
  const res = await fetch('/api/admin/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ table, action, data, query }),
  });
  if (res.status === 401) throw new AdminSessionExpiredError();
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to perform secure database write.');
  }
  return res.json();
}

/** Ask the server whether the admin session cookie is still valid. */
export async function checkAdminSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    return res.ok && json.ok === true;
  } catch {
    return false;
  }
}

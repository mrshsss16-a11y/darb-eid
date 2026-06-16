export async function secureAdminWrite(
  table: 'settings' | 'templates' | 'overrides' | 'hero_overrides',
  action: 'upsert' | 'insert' | 'update' | 'delete',
  data?: any,
  query?: { key: string; val: any; operator?: 'eq' | 'neq' }
) {
  const res = await fetch('/api/admin/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, action, data, query }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to perform secure database write.');
  }
  return res.json();
}

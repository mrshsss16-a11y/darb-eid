/**
 * Supabase Storage path parsing for the `templates` bucket.
 *
 * Isomorphic (no secrets, no Node built-ins) so the same rules run in the
 * admin API route and, if ever needed, in the browser.
 *
 * Why this exists: /api/admin/upload hands the admin a PUBLIC URL such as
 *   https://<ref>.supabase.co/storage/v1/object/public/templates/2026-09/square-<uuid>.png
 * and that URL is what ends up in the `templates.source` JSONB. To clean up an
 * orphaned object we have to turn that URL back into the bucket-relative path
 * `2026-09/square-<uuid>.png` — and we must do it defensively, because the URL
 * travels through the client. A caller must never be able to talk the delete
 * endpoint into touching another bucket (`station-images`, `partners-logos`
 * belong to a different app) or an arbitrary object.
 */

export const TEMPLATES_BUCKET = 'templates';

/**
 * Bucket-relative object paths we are willing to delete.
 *
 * Exactly one `YYYY-MM/` folder segment followed by a plain image filename.
 * This deliberately excludes `..`, nested folders, leading slashes, query
 * strings and anything that is not a raster image written by the upload route.
 */
const OBJECT_PATH_RE = /^\d{4}-\d{2}\/[A-Za-z0-9._-]{1,120}\.(?:png|jpe?g|webp|gif)$/;

/** The segment that precedes the bucket name in a Storage public URL. */
const PUBLIC_PREFIX = '/storage/v1/object/public/';

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host.toLowerCase() === new URL(b).host.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Turn an admin-supplied value into a safe `templates`-bucket object path.
 *
 * Accepts either:
 *   - a public Storage URL on THIS project's Supabase host, pointing at the
 *     `templates` bucket, or
 *   - an already bucket-relative path (`2026-09/square-<uuid>.png`).
 *
 * Returns null for anything else: other hosts, other buckets, data URLs,
 * traversal attempts, non-image extensions, oversized input.
 *
 * @param input        the URL or path to parse
 * @param supabaseUrl  the project's Supabase URL (NEXT_PUBLIC_SUPABASE_URL)
 */
export function parseTemplateObjectPath(input: unknown, supabaseUrl: string | undefined): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value || value.length > 1024) return null;
  // Never accept inline images — there is nothing in Storage to delete.
  if (/^data:/i.test(value)) return null;

  let candidate: string;

  if (/^https?:\/\//i.test(value)) {
    if (!supabaseUrl || !sameHost(value, supabaseUrl)) return null;
    let u: URL;
    try {
      u = new URL(value);
    } catch {
      return null;
    }
    // Reject anything carrying a query/fragment: it is not a plain object URL.
    if (u.search || u.hash) return null;
    const pathname = decodeURIComponent(u.pathname);
    if (!pathname.startsWith(PUBLIC_PREFIX)) return null;
    const rest = pathname.slice(PUBLIC_PREFIX.length);
    const slash = rest.indexOf('/');
    if (slash <= 0) return null;
    // Bucket must be exactly `templates` — never another app's bucket.
    if (rest.slice(0, slash) !== TEMPLATES_BUCKET) return null;
    candidate = rest.slice(slash + 1);
  } else {
    candidate = value.startsWith(`${TEMPLATES_BUCKET}/`)
      ? value.slice(TEMPLATES_BUCKET.length + 1)
      : value;
  }

  if (candidate.includes('..') || candidate.includes('//')) return null;
  if (!OBJECT_PATH_RE.test(candidate)) return null;
  return candidate;
}

/** Parse many values at once, dropping rejects and duplicates. Order preserved. */
export function parseTemplateObjectPaths(
  inputs: readonly unknown[],
  supabaseUrl: string | undefined,
): { paths: string[]; rejected: number } {
  const seen = new Set<string>();
  let rejected = 0;
  for (const raw of inputs) {
    const p = parseTemplateObjectPath(raw, supabaseUrl);
    if (p) seen.add(p);
    else rejected++;
  }
  return { paths: [...seen], rejected };
}

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_COOKIE, verifySessionToken, isSameOriginRequest } from '@/utils/adminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/upload — moves template images out of JSONB and into
 * Supabase Storage (public bucket `templates`, see supabase_storage.sql).
 *
 * Three call shapes (all require the admin session cookie):
 *
 *  A) multipart/form-data  field `file` (+ optional `format`: square|story|post)
 *  B) application/json     { dataUrl: "data:image/png;base64,....", format?: "square" }
 *     → server uploads with the service-role key and returns
 *       { ok:true, url, path, bytes, contentType }
 *     Bodies through Vercel serverless functions are capped at ~4.5 MB, so use C for big files.
 *
 *  C) application/json     { action: "sign", contentType: "image/png", format?: "square" }
 *     → returns { ok:true, signedUrl, token, path, url } ; the browser then does
 *       fetch(signedUrl, { method:'PUT', headers:{ 'Content-Type': contentType }, body: file })
 *       and stores `url` (public URL). No size limit besides the bucket's (8 MB).
 *
 * Only raster images are accepted (PNG/JPEG/WebP/GIF, sniffed by magic bytes).
 * SVG is rejected on purpose: a public bucket serving image/svg+xml is a
 * stored-XSS vector when opened directly.
 */

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB hard cap (matches bucket file_size_limit)
const BUCKET = 'templates';
const NO_STORE = { 'Cache-Control': 'no-store' };

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status, headers: NO_STORE });
}

/** Sniff the real type from magic bytes; never trust the declared MIME. */
function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}

function safeFormat(v: unknown): string {
  return v === 'square' || v === 'story' || v === 'post' ? v : 'misc';
}

function objectPath(format: string, ext: string): string {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${ym}/${format}-${crypto.randomUUID()}.${ext}`;
}

function getAdminStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; declared: string } | null {
  const m = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!m) return null;
  try {
    return { bytes: new Uint8Array(Buffer.from(m[2].replace(/\s/g, ''), 'base64')), declared: m[1].toLowerCase() };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    if (!(await verifySessionToken(cookies().get(ADMIN_COOKIE)?.value))) return bad('Unauthorized', 401);
    if (!isSameOriginRequest(req)) return bad('Forbidden', 403);

    const storage = getAdminStorage();
    if (!storage) {
      console.error('[admin/upload] Supabase env vars missing.');
      return bad('Server configuration error', 500);
    }

    const declaredLen = Number(req.headers.get('content-length') || 0);
    // base64 inflates ~33%; allow a little headroom over the raw cap.
    if (declaredLen > MAX_UPLOAD_BYTES * 1.4) return bad('File too large (max 8 MB).', 413);

    const ctype = req.headers.get('content-type') || '';
    let bytes: Uint8Array | null = null;
    let format = 'misc';

    if (ctype.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      format = safeFormat(form.get('format'));
      if (!(file instanceof Blob)) return bad("Missing 'file' field.");
      if (file.size > MAX_UPLOAD_BYTES) return bad('File too large (max 8 MB).', 413);
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return bad('Invalid JSON');
      }
      format = safeFormat(body.format);

      // ── Shape C: signed direct-to-storage upload URL ──
      if (body.action === 'sign') {
        const contentType = typeof body.contentType === 'string' ? body.contentType.toLowerCase() : '';
        const ext = MIME_EXT[contentType];
        if (!ext) return bad('Unsupported contentType (png, jpeg, webp, gif only).');
        const path = objectPath(format, ext);
        const { data, error } = await storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) {
          console.error('[admin/upload] createSignedUploadUrl failed:', error?.message);
          return bad('Could not create upload URL', 500);
        }
        const url = storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        return NextResponse.json(
          { ok: true, signedUrl: data.signedUrl, token: data.token, path, url, contentType },
          { headers: NO_STORE },
        );
      }

      // ── Shape B: data URL ──
      if (typeof body.dataUrl !== 'string') return bad("Provide 'dataUrl' or 'file'.");
      if (body.dataUrl.length > MAX_UPLOAD_BYTES * 1.4) return bad('File too large (max 8 MB).', 413);
      const decoded = decodeDataUrl(body.dataUrl);
      if (!decoded) return bad('Invalid data URL.');
      bytes = decoded.bytes;
    }

    if (!bytes || bytes.length === 0) return bad('Empty file.');
    if (bytes.length > MAX_UPLOAD_BYTES) return bad('File too large (max 8 MB).', 413);

    const mime = sniffMime(bytes);
    if (!mime) return bad('Unsupported image type (png, jpeg, webp, gif only).', 415);
    const path = objectPath(format, MIME_EXT[mime]);

    const { error } = await storage.from(BUCKET).upload(path, bytes, {
      contentType: mime,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      console.error('[admin/upload] upload failed:', error.message);
      return bad('Upload failed', 500);
    }

    const url = storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ ok: true, url, path, bytes: bytes.length, contentType: mime }, { headers: NO_STORE });
  } catch (err) {
    console.error('[admin/upload] Unhandled error:', err);
    return bad('Internal Server Error', 500);
  }
}

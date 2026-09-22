-- =========================================================================
-- DARB — Supabase Storage bucket for template images
-- -------------------------------------------------------------------------
-- Run once in the Supabase SQL Editor (after supabase_schema.sql).
--
-- Why: template images were stored as base64 inside templates.source (JSONB),
-- making every gallery load pull multi-MB rows over REST + Realtime.
-- Images now live in a PUBLIC bucket and rows only hold the URL.
--
-- Security model:
--   * Anyone can READ objects (public bucket → CDN-cached, immutable URLs).
--   * Only the service_role key (used by /api/admin/upload, behind the admin
--     session cookie) can INSERT / UPDATE / DELETE. No anon write policies.
--   * Raster images only, 8 MB max — enforced both here and in the API.
-- =========================================================================

-- 1. Bucket (idempotent). file_size_limit is bytes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  true,
  8388608,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Policies on storage.objects (RLS is already enabled by Supabase).
DROP POLICY IF EXISTS "Public read templates bucket" ON storage.objects;
CREATE POLICY "Public read templates bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'templates');

-- Writes: intentionally NO policy for anon/authenticated.
-- service_role bypasses RLS, so the server-side upload route works without one.
DROP POLICY IF EXISTS "Anon upload templates bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anon update templates bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anon delete templates bucket" ON storage.objects;

-- 3. (Optional, recommended) once all rows point at Storage URLs, forbid new
--    base64 blobs in templates.source so the table cannot bloat again:
-- ALTER TABLE templates ADD CONSTRAINT templates_source_not_base64
--   CHECK (length(source::text) < 65536);

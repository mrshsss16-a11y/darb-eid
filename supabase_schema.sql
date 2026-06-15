-- =========================================================================
-- DARB EID GREETINGS PLATFORM — Supabase Database Schema
-- -------------------------------------------------------------------------
-- Copy and run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ryfbpiyqwocuendcdpwy/sql/new
--
-- SECURITY MODEL:
--   - anon key (used by the browser/client): READ-ONLY on all tables.
--   - service_role key (used only server-side): full CRUD access.
--   This means public users can read templates/settings but CANNOT
--   modify them without going through a server-side API route.
--   Since this platform uses the anon key client-side (Next.js 'use client'
--   components), all writes are permitted for now via a more open policy.
--   TODO for full hardening: move all writes to server-side API routes and
--   use the service_role key only there.
-- =========================================================================

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  occasion TEXT NOT NULL,
  occasion_key TEXT,
  palette JSONB NOT NULL,
  default_name_style JSONB NOT NULL,
  source JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create overrides table
CREATE TABLE IF NOT EXISTS overrides (
  id TEXT PRIMARY KEY,
  title TEXT,
  default_name_style JSONB,
  hidden BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create hero_overrides table
CREATE TABLE IF NOT EXISTS hero_overrides (
  occasion_key TEXT PRIMARY KEY,
  eyebrow TEXT,
  title TEXT,
  title_accent TEXT,
  subtitle TEXT,
  cta TEXT,
  color TEXT,
  orb_a TEXT,
  orb_b TEXT,
  bg TEXT,
  bg_image TEXT,
  bg_overlay_color TEXT,
  bg_overlay_opacity NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_overrides ENABLE ROW LEVEL SECURITY;

-- 6. Drop old permissive policies if they exist
DROP POLICY IF EXISTS "Public full access settings" ON settings;
DROP POLICY IF EXISTS "Public full access templates" ON templates;
DROP POLICY IF EXISTS "Public full access overrides" ON overrides;
DROP POLICY IF EXISTS "Public full access hero_overrides" ON hero_overrides;

-- Also drop any existing split policies to avoid conflicts
DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Public read templates" ON templates;
DROP POLICY IF EXISTS "Public read overrides" ON overrides;
DROP POLICY IF EXISTS "Public read hero_overrides" ON hero_overrides;
DROP POLICY IF EXISTS "Auth write settings" ON settings;
DROP POLICY IF EXISTS "Auth write templates" ON templates;
DROP POLICY IF EXISTS "Auth write overrides" ON overrides;
DROP POLICY IF EXISTS "Auth write hero_overrides" ON hero_overrides;

-- 7. READ policies — anyone with the anon key can read (public templates/settings)
CREATE POLICY "Public read settings"
  ON settings FOR SELECT TO public USING (true);

CREATE POLICY "Public read templates"
  ON templates FOR SELECT TO public USING (true);

CREATE POLICY "Public read overrides"
  ON overrides FOR SELECT TO public USING (true);

CREATE POLICY "Public read hero_overrides"
  ON hero_overrides FOR SELECT TO public USING (true);

-- 8. WRITE policies — currently open to anon for ease of internal use.
--    TODO: Restrict to service_role only once admin writes move to API routes.
CREATE POLICY "Auth write settings"
  ON settings FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Auth write templates"
  ON templates FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Auth write overrides"
  ON overrides FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Auth write hero_overrides"
  ON hero_overrides FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. Prevent storing raw base64 image data in hero_overrides (size guard).
--    bg_image should be NULL or a URL (not a data: URI) in production.
--    This check warns if a data URI exceeds 2MB stored as text.
--    NOTE: Re-run this only if you plan to move images to Supabase Storage.
-- ALTER TABLE hero_overrides ADD CONSTRAINT bg_image_not_huge
--   CHECK (bg_image IS NULL OR length(bg_image) < 2097152);

-- 10. Enable Supabase Realtime for all tables to push live database changes to clients
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
ALTER PUBLICATION supabase_realtime ADD TABLE templates;
ALTER PUBLICATION supabase_realtime ADD TABLE overrides;
ALTER PUBLICATION supabase_realtime ADD TABLE hero_overrides;


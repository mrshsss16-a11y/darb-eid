import type { NameStyle, OccasionKey, StoredTemplate } from '@/templates/types';

/**
 * Row <-> model mappers for the `templates` and `overrides` tables.
 *
 * Keeping the column names in exactly one place means the read path
 * (`useTemplates`) and the write path (`secureAdminWrite`) can never drift.
 */

/** Exact shape of a row in `public.templates`. */
export interface TemplateRow {
  id: string;
  title: string;
  occasion: string;
  occasion_key: string | null;
  palette: StoredTemplate['palette'];
  default_name_style: NameStyle;
  source: StoredTemplate['source'];
  created_at?: string | null;
}

/** Exact shape of a row in `public.overrides`. */
export interface OverrideRow {
  id: string;
  title: string | null;
  default_name_style: NameStyle | null;
  hidden: boolean | null;
  updated_at?: string | null;
}

/** Per-seed-template admin override (kept in the `overrides` table). */
export interface TemplateOverride {
  title?: string;
  defaultNameStyle?: NameStyle;
  /** True → seed template is hidden from the public gallery / editor list. */
  hidden?: boolean;
}

export type TemplateOverrides = Record<string, TemplateOverride>;

/** Columns fetched for the gallery / editor. `created_at` drives ordering. */
export const TEMPLATE_COLUMNS =
  'id,title,occasion,occasion_key,palette,default_name_style,source,created_at';

export const OVERRIDE_COLUMNS = 'id,title,default_name_style,hidden';

function isValidSource(src: unknown): src is StoredTemplate['source'] {
  if (!src || typeof src !== 'object') return false;
  const s = src as { kind?: unknown; key?: unknown; imageDataUrl?: unknown };
  if (s.kind === 'seed') return typeof s.key === 'string';
  if (s.kind === 'custom') return typeof s.imageDataUrl === 'string';
  return false;
}

/** Convert a DB row to the app model. Returns null for corrupt rows. */
export function templateRowToStored(row: TemplateRow): StoredTemplate | null {
  if (!row || typeof row.id !== 'string' || typeof row.title !== 'string') return null;
  if (!isValidSource(row.source)) {
    console.error(`[templateRows] template "${row.id}" has an invalid source column; skipping`, row.source);
    return null;
  }
  if (!row.default_name_style || typeof row.default_name_style !== 'object') {
    console.error(`[templateRows] template "${row.id}" has no default_name_style; skipping`);
    return null;
  }
  return {
    id: row.id,
    title: row.title,
    occasion: row.occasion ?? '',
    occasionKey: (row.occasion_key ?? undefined) as OccasionKey | undefined,
    palette: row.palette ?? { accent: '#F26B1F', bg: '#F5E6D3' },
    defaultNameStyle: row.default_name_style,
    source: row.source,
  };
}

/** Convert the app model to a full DB row (for insert / upsert). */
export function storedToTemplateRow(item: StoredTemplate): TemplateRow {
  return {
    id: item.id,
    title: item.title,
    occasion: item.occasion,
    occasion_key: item.occasionKey ?? null,
    palette: item.palette,
    default_name_style: item.defaultNameStyle,
    source: item.source,
  };
}

export function overrideRowToOverride(row: OverrideRow): TemplateOverride {
  return {
    title: row.title ?? undefined,
    defaultNameStyle: row.default_name_style ?? undefined,
    hidden: !!row.hidden,
  };
}

export function overrideToRow(id: string, o: TemplateOverride): OverrideRow {
  return {
    id,
    title: o.title ?? null,
    default_name_style: o.defaultNameStyle ?? null,
    hidden: o.hidden ?? false,
  };
}

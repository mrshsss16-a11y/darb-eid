import type { Template, ArtworkRenderer } from './types';
import { CrescentElegance } from './designs/CrescentElegance';
import { GoldenMosque } from './designs/GoldenMosque';
import { GeometricPattern } from './designs/GeometricPattern';
import { ModernCalligraphy } from './designs/ModernCalligraphy';
import { DesertSunset } from './designs/DesertSunset';
import { MarbleLuxury } from './designs/MarbleLuxury';
import { RamadanCrescent } from './designs/RamadanCrescent';
import { NationalDay } from './designs/NationalDay';

/**
 * Built-in design renderers, keyed by stable ID.
 * Stored templates reference these by key, so renaming a key is a breaking change.
 *
 * TO ADD A NEW BUILT-IN DESIGN:
 *  1. Create `src/templates/designs/MyDesign.tsx` exporting an ArtworkRenderer.
 *  2. Register it here with a stable key.
 *  3. Add a seed template below (or via admin).
 */
export const BUILTIN_DESIGNS: Record<string, ArtworkRenderer> = {
  CrescentElegance,
  GoldenMosque,
  GeometricPattern,
  ModernCalligraphy,
  DesertSunset,
  MarbleLuxury,
  RamadanCrescent,
  NationalDay,
};

/**
 * Seed templates shipped with the platform. The admin dashboard can override
 * positions/fonts and add new ones, but these always exist as a baseline.
 */
export const seedTemplates: Template[] = [
  {
    id: 'crescent-elegance',
    title: 'هلال الأناقة',
    occasion: 'عيد الأضحى المبارك',
    occasionKey: 'eid-adha',
    palette: { accent: '#F26B1F', bg: '#FFF8F0' },
    defaultNameStyle: {
      x: 50, y: 75, align: 'center',
      fontSizePct: 4.5, color: '#A93F09', maxWidthPct: 75,
      preset: 'bottom', weight: 700, shadow: false,
    },
    renderArtwork: CrescentElegance,
  },
  {
    id: 'golden-mosque',
    title: 'الجامع الذهبي',
    occasion: 'عيد الأضحى المبارك',
    occasionKey: 'eid-adha',
    palette: { accent: '#F26B1F', bg: '#1A1A1D' },
    defaultNameStyle: {
      x: 50, y: 38, align: 'center',
      fontSizePct: 4, color: '#FFE3D0', maxWidthPct: 80,
      preset: 'custom', weight: 700, shadow: true,
    },
    renderArtwork: GoldenMosque,
  },
  {
    id: 'geometric-pattern',
    title: 'الزخرفة الإسلامية',
    occasion: 'عيد مبارك',
    occasionKey: 'eid-adha',
    palette: { accent: '#A93F09', bg: '#FFF8F0' },
    defaultNameStyle: {
      x: 50, y: 58, align: 'center',
      fontSizePct: 4.2, color: '#4F1B02', maxWidthPct: 60,
      preset: 'center', weight: 700, shadow: false,
    },
    renderArtwork: GeometricPattern,
  },
  {
    id: 'modern-calligraphy',
    title: 'الخط الحديث',
    occasion: 'عيد مبارك',
    occasionKey: 'eid-adha',
    palette: { accent: '#F26B1F', bg: '#0E0E10' },
    defaultNameStyle: {
      x: 50, y: 68, align: 'center',
      fontSizePct: 4.5, color: '#FFF8F0', maxWidthPct: 80,
      preset: 'custom', weight: 900, shadow: false,
    },
    renderArtwork: ModernCalligraphy,
  },
  {
    id: 'desert-sunset',
    title: 'غروب الصحراء',
    occasion: 'عيد الأضحى المبارك',
    occasionKey: 'eid-adha',
    palette: { accent: '#A93F09', bg: '#FFE3D0' },
    defaultNameStyle: {
      x: 50, y: 33, align: 'center',
      fontSizePct: 4, color: '#FFF8F0', maxWidthPct: 75,
      preset: 'custom', weight: 700, shadow: true,
    },
    renderArtwork: DesertSunset,
  },
  {
    id: 'marble-luxury',
    title: 'الرخام الفاخر',
    occasion: 'عيد الأضحى المبارك',
    occasionKey: 'eid-adha',
    palette: { accent: '#F26B1F', bg: '#FAFAFB' },
    defaultNameStyle: {
      x: 50, y: 60, align: 'center',
      fontSizePct: 4.2, color: '#0E0E10', maxWidthPct: 70,
      preset: 'custom', weight: 900, shadow: false,
    },
    renderArtwork: MarbleLuxury,
  },
  // ─────────── Ramadan ───────────
  {
    id: 'ramadan-crescent',
    title: 'هلال رمضان',
    occasion: 'رمضان المبارك',
    occasionKey: 'ramadan',
    palette: { accent: '#FFA068', bg: '#0E1530' },
    defaultNameStyle: {
      x: 50, y: 82, align: 'center',
      fontSizePct: 4.4, color: '#FFE3D0', maxWidthPct: 80,
      preset: 'bottom', weight: 700, shadow: true,
    },
    renderArtwork: RamadanCrescent,
  },
  // ─────────── National Day ───────────
  {
    id: 'national-day-saudi',
    title: 'اليوم الوطني السعودي',
    occasion: 'اليوم الوطني',
    occasionKey: 'national-day',
    palette: { accent: '#FFE3D0', bg: '#005430' },
    defaultNameStyle: {
      x: 50, y: 62, align: 'center',
      fontSizePct: 4.6, color: '#FFFFFF', maxWidthPct: 80,
      preset: 'custom', weight: 900, shadow: true,
    },
    renderArtwork: NationalDay,
  },
];

/**
 * Template type definitions.
 *
 * A "template" is a branded greeting card design. It has:
 *  - a unique id (slug used in URLs)
 *  - a title (Arabic) shown in the gallery
 *  - a renderArtwork(format) function returning the SVG/JSX background
 *  - a defaultNameStyle that places the employee name nicely on top
 *  - a palette object with accent colours so the gallery card matches the artwork
 *
 * To add a new template:
 *  1. Create a new file in /src/templates/designs/MyTemplate.tsx that exports
 *     a React component (sig: ({ format }) => JSX) returning an inline <svg>.
 *  2. Add an entry to seedTemplates in /src/templates/seed.ts importing your
 *     component, picking a default name style + palette.
 *  3. Done — the gallery, editor, and admin auto-pick it up.
 */

/**
 * Occasion keys — stable identifiers used to group templates.
 *
 * To add a new occasion:
 *   1. Add its key here.
 *   2. Add a matching entry to OCCASIONS below (title, emoji, accent color).
 *   3. (Optional) seed a few templates with the new occasionKey in seed.ts.
 */
export type OccasionKey =
  | 'eid-adha'
  | 'eid-fitr'
  | 'ramadan'
  | 'hajj'
  | 'hijri-new-year'
  | 'national-day'
  | 'general';

export interface OccasionMeta {
  key: OccasionKey;
  title: string;
  /** Short tagline shown under the title in filter chips. */
  tagline: string;
  /** Brand-aligned accent colour for the chip / badge. */
  color: string;
  /** Background colour for the inactive chip state. */
  bg: string;
  /** Dark mode accent colour for high contrast. */
  darkColor?: string;
  /** Dark mode chip background colour. */
  darkBg?: string;
  /** Hero-mode strings — used when this occasion is set as the active site mode. */
  hero: {
    eyebrow: string;     // small badge above title
    title: string;       // main h1
    titleAccent: string; // last word styled in accent colour
    subtitle: string;    // longer description
    cta: string;         // CTA button label
  };
  /** Pair of colours used to tint the hero's decorative orbs. */
  orbColors: [string, string];
}

export const OCCASIONS: OccasionMeta[] = [
  {
    key: 'eid-adha', title: 'عيد الأضحى', tagline: 'تقبّل الله',
    color: '#F26B1F', bg: '#FFF4EC',
    darkColor: '#FF7E3A', darkBg: 'rgba(255,126,58,0.12)',
    orbColors: ['#FFA068', '#F26B1F'],
    hero: {
      eyebrow: 'عيد الأضحى المبارك',
      title: 'بطاقات معايدة',
      titleAccent: 'عيد الأضحى',
      subtitle: 'اختر التصميم، أضف اسمك، وحمّل بطاقتك جاهزة لمشاركة فرحة العيد مع زملائك وأحبائك.',
      cta: 'استعرض قوالب العيد',
    },
  },
  {
    key: 'eid-fitr', title: 'عيد الفطر', tagline: 'كل عام وأنتم بخير',
    color: '#FF9B5E', bg: '#FFE3D0',
    darkColor: '#FFAB7C', darkBg: 'rgba(255,171,124,0.12)',
    orbColors: ['#FFE3D0', '#FF9B5E'],
    hero: {
      eyebrow: 'عيد الفطر السعيد',
      title: 'معايدات',
      titleAccent: 'عيد الفطر',
      subtitle: 'تقبّل الله طاعتكم. صمّم بطاقتك الخاصة وشاركها بكبسة زر.',
      cta: 'استعرض قوالب العيد',
    },
  },
  {
    key: 'ramadan', title: 'رمضان المبارك', tagline: 'شهر الخير',
    color: '#5B3FA3', bg: '#F5E6D3',
    darkColor: '#A78BFA', darkBg: 'rgba(167,139,250,0.12)',
    orbColors: ['#7E63C8', '#3D2978'],
    hero: {
      eyebrow: 'رمضان المبارك',
      title: 'بطاقات',
      titleAccent: 'رمضان كريم',
      subtitle: 'صمّم بطاقتك الرمضانية الرسمية باسم درب وشاركها مع فريقك وعملائك.',
      cta: 'استعرض قوالب رمضان',
    },
  },
  {
    key: 'hajj', title: 'الحج', tagline: 'حجٌ مبرور',
    color: '#0E6D52', bg: '#E3F2EB',
    darkColor: '#34D399', darkBg: 'rgba(52,211,153,0.12)',
    orbColors: ['#37A07B', '#0E6D52'],
    hero: {
      eyebrow: 'موسم الحج',
      title: 'تهانينا',
      titleAccent: 'بالحج المبرور',
      subtitle: 'تقبّل الله من حُجّاج بيت الله الحرام. أرسل تهانيك بتصميم رسمي من درب.',
      cta: 'استعرض قوالب الحج',
    },
  },
  {
    key: 'hijri-new-year', title: 'السنة الهجرية', tagline: 'عام هجري جديد',
    color: '#1B4E8A', bg: '#E5EEF8',
    darkColor: '#60A5FA', darkBg: 'rgba(96,165,250,0.12)',
    orbColors: ['#3A78C2', '#102E55'],
    hero: {
      eyebrow: 'السنة الهجرية الجديدة',
      title: 'كل عام',
      titleAccent: 'وأنتم بخير',
      subtitle: 'سنة هجرية جديدة مليئة بالخير. شارك تهانيك بتصميم رسمي من درب.',
      cta: 'استعرض قوالب السنة الهجرية',
    },
  },
  {
    key: 'national-day', title: 'اليوم الوطني', tagline: 'اليوم الوطني السعودي',
    color: '#005430', bg: '#E2F2EA',
    darkColor: '#34D399', darkBg: 'rgba(52,211,153,0.12)',
    orbColors: ['#0A8F50', '#003520'],
    hero: {
      eyebrow: 'اليوم الوطني السعودي',
      title: 'اليوم الوطني',
      titleAccent: 'السعودي',
      subtitle: 'فخر الانتماء للمملكة العربية السعودية. شارك تهانيك الوطنية بتصميم رسمي من درب.',
      cta: 'استعرض قوالب اليوم الوطني',
    },
  },
  {
    key: 'general', title: 'عام', tagline: 'لكل المناسبات',
    color: '#F26B1F', bg: '#F0F0F2',
    darkColor: '#FF7E3A', darkBg: '#1A1A1D',
    orbColors: ['#FFA068', '#F26B1F'],
    hero: {
      eyebrow: 'منصة درب الداخلية',
      title: 'قوالب معايدة',
      titleAccent: 'درب',
      subtitle: 'اختر قالب المعايدة، أضف اسمك، وحمّل بطاقتك جاهزة للمشاركة على واتساب، لينكدإن، وانستقرام.',
      cta: 'تصفّح القوالب',
    },
  },
];

export function getOccasion(key: OccasionKey | undefined): OccasionMeta {
  return OCCASIONS.find((o) => o.key === key) ?? OCCASIONS[OCCASIONS.length - 1];
}

export type CanvasFormat = 'square' | 'story' | 'post';

export const FORMAT_DIMENSIONS: Record<CanvasFormat, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: 'مربع — انستقرام / واتساب' },
  story:  { w: 1080, h: 1920, label: 'ستوري — انستقرام / واتساب' },
  post:   { w: 1200, h: 630,  label: 'منشور — لينكدإن / تويتر' },
};

export type TextAlign = 'right' | 'center' | 'left';

export interface NameStyle {
  /** Position from left as % of canvas width. */
  x: number;
  /** Position from top as % of canvas height. */
  y: number;
  /** Anchoring of the name block at (x,y). */
  align: TextAlign;
  /** Font size as % of canvas width (so it scales across formats). */
  fontSizePct: number;
  /** Hex colour. */
  color: string;
  /** Maximum width as % of canvas, used by auto-fit shrinking. */
  maxWidthPct: number;
  /** Optional preset label shown in UI (Bottom/Center/Custom). */
  preset?: 'bottom' | 'center' | 'top' | 'custom';
  /** Font weight (CSS). */
  weight?: 300 | 400 | 500 | 700 | 900;
  /** Optional text shadow for legibility on busy artwork. */
  shadow?: boolean;
  /** Optional format-specific overrides. */
  formats?: {
    square?: Partial<NameStyle>;
    story?: Partial<NameStyle>;
    post?: Partial<NameStyle>;
  };
}

export function getFormatNameStyle(baseStyle: NameStyle, format: CanvasFormat): NameStyle {
  if (!baseStyle) return baseStyle;
  const overrides = baseStyle.formats?.[format];
  if (!overrides) return baseStyle;
  const { formats: _, ...restOverrides } = overrides as any;
  return {
    ...baseStyle,
    ...restOverrides,
  };
}

export function updateFormatNameStyle(
  baseStyle: NameStyle,
  format: CanvasFormat,
  updatedFields: Partial<NameStyle>
): NameStyle {
  const formats = baseStyle.formats || {};
  const currentOverride = formats[format] || {};
  const { formats: _, ...fieldsToSave } = updatedFields;

  const nextFormats = {
    ...formats,
    [format]: {
      ...currentOverride,
      ...fieldsToSave,
    },
  };

  if (format === 'square') {
    return {
      ...baseStyle,
      ...fieldsToSave,
      formats: nextFormats,
    };
  }

  return {
    ...baseStyle,
    formats: nextFormats,
  };
}


export interface PositionPreset {
  id: 'bottom' | 'center' | 'top';
  label: string;
  apply: (current: NameStyle) => NameStyle;
}

export const POSITION_PRESETS: PositionPreset[] = [
  {
    id: 'bottom',
    label: 'أسفل',
    apply: (c) => ({ ...c, x: 50, y: 78, align: 'center', preset: 'bottom' }),
  },
  {
    id: 'center',
    label: 'وسط',
    apply: (c) => ({ ...c, x: 50, y: 50, align: 'center', preset: 'center' }),
  },
  {
    id: 'top',
    label: 'أعلى',
    apply: (c) => ({ ...c, x: 50, y: 22, align: 'center', preset: 'top' }),
  },
];

/** Renderer signature shared by all template designs. */
export type ArtworkRenderer = (args: {
  format: CanvasFormat;
}) => React.ReactNode;

export interface Template {
  id: string;
  title: string;
  /** Human-readable occasion label, e.g. "عيد الأضحى المبارك". */
  occasion: string;
  /** Machine-readable occasion key used for filtering/grouping. */
  occasionKey?: OccasionKey;
  /** Hex tuple [accent, background] used for gallery card preview chip. */
  palette: { accent: string; bg: string };
  defaultNameStyle: NameStyle;
  renderArtwork: ArtworkRenderer;
  /** Optional: a custom uploaded image (data URL) used in place of renderArtwork.
   *  Admin-uploaded templates will set this. */
  customImage?: string;
  customImages?: {
    square?: string;
    story?: string;
    post?: string;
  };
}

/** Persisted (serialisable) shape — used when admin stores templates in storage. */
export interface StoredTemplate {
  id: string;
  title: string;
  occasion: string;
  occasionKey?: OccasionKey;
  palette: { accent: string; bg: string };
  defaultNameStyle: NameStyle;
  /** Either a key referencing a built-in design (seed) or a data URL. */
  source:
    | { kind: 'seed'; key: string }
    | {
        kind: 'custom';
        imageDataUrl: string;
        images?: {
          square?: string;
          story?: string;
          post?: string;
        };
      };
}

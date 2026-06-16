'use client';

import { OCCASIONS, type OccasionKey } from '@/templates/types';
import { cn } from '@/utils/cn';
import { useTheme } from './ThemeProvider';

interface Props {
  /** Selected occasion key, or null for "all". */
  value: OccasionKey | null;
  onChange: (v: OccasionKey | null) => void;
  /** Optional per-occasion count to show in the chip. */
  counts?: Partial<Record<OccasionKey | 'all', number>>;
}

/**
 * Horizontal scrollable chip row that filters the gallery by occasion.
 * "الكل" chip selects null (show everything).
 */
export function OccasionFilter({ value, onChange, counts }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const allCount = counts?.all;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x no-scrollbar">
      <Chip
        active={value === null}
        onClick={() => onChange(null)}
        label="الكل"
        count={allCount}
        accent="#5B5B63"
        bg="#F0F0F2"
        isDark={isDark}
      />
      {OCCASIONS.filter((o) => o.key !== 'general').map((o) => (
        <Chip
          key={o.key}
          active={value === o.key}
          onClick={() => onChange(o.key)}
          label={o.title}
          tagline={o.tagline}
          count={counts?.[o.key]}
          accent={o.color}
          bg={o.bg}
          isDark={isDark}
        />
      ))}
    </div>
  );
}

function Chip({
  active, onClick, label, tagline, count, accent, bg, isDark,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tagline?: string;
  count?: number;
  accent: string;
  bg: string;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'snap-start shrink-0 inline-flex flex-col items-start rounded-2xl px-4 py-2.5 transition-all',
        'border-2',
        active
          ? 'shadow-md scale-[1.02]'
          : 'border-transparent hover:scale-[1.01]',
      )}
      style={{
        background: active ? accent : (isDark ? '#1A1A1D' : bg),
        borderColor: active ? accent : (isDark ? '#2C2C30' : 'transparent'),
        color: active ? '#FFFFFF' : (isDark ? '#FAFAFB' : '#1A1A1D'),
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">{label}</span>
        {typeof count === 'number' && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
            style={{
              background: active ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
              color: active ? '#FFFFFF' : (isDark ? '#B9B9C0' : '#5B5B63'),
            }}
          >
            {count}
          </span>
        )}
      </div>
      {tagline && (
        <span
          className="text-[10px] mt-0.5"
          style={{ color: active ? 'rgba(255,255,255,0.85)' : (isDark ? '#B9B9C0' : '#5B5B63') }}
        >
          {tagline}
        </span>
      )}
    </button>
  );
}

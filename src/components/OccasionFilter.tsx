'use client';

import { OCCASIONS, type OccasionKey } from '@/templates/types';
import { cn } from '@/utils/cn';

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
  const allCount = counts?.all;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
      <Chip
        active={value === null}
        onClick={() => onChange(null)}
        label="الكل"
        count={allCount}
        accent="#5B5B63"
        bg="#F0F0F2"
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
        />
      ))}
    </div>
  );
}

function Chip({
  active, onClick, label, tagline, count, accent, bg,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tagline?: string;
  count?: number;
  accent: string;
  bg: string;
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
        background: active ? accent : bg,
        borderColor: active ? accent : 'transparent',
        color: active ? '#FFFFFF' : '#1A1A1D',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">{label}</span>
        {typeof count === 'number' && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
            style={{
              background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
            }}
          >
            {count}
          </span>
        )}
      </div>
      {tagline && (
        <span
          className="text-[10px] mt-0.5"
          style={{ color: active ? 'rgba(255,255,255,0.85)' : '#5B5B63' }}
        >
          {tagline}
        </span>
      )}
    </button>
  );
}

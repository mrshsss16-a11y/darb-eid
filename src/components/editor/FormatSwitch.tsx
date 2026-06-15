'use client';

import { Square, RectangleVertical, RectangleHorizontal } from 'lucide-react';
import type { CanvasFormat } from '@/templates/types';
import { cn } from '@/utils/cn';

const OPTIONS: { id: CanvasFormat; label: string; icon: typeof Square }[] = [
  { id: 'square', label: 'مربع',  icon: Square },
  { id: 'story',  label: 'ستوري', icon: RectangleVertical },
  { id: 'post',   label: 'منشور', icon: RectangleHorizontal },
];

interface Props {
  value: CanvasFormat;
  onChange: (f: CanvasFormat) => void;
}

export function FormatSwitch({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-2xl bg-ink-100 dark:bg-ink-800 p-1 gap-1">
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              active
                ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-ink-600 dark:text-ink-300 hover:bg-white/60 dark:hover:bg-ink-700/60',
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

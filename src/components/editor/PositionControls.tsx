'use client';

import { AlignCenter, AlignLeft, AlignRight, MoveVertical } from 'lucide-react';
import type { NameStyle } from '@/templates/types';
import { POSITION_PRESETS } from '@/templates/types';
import { cn } from '@/utils/cn';

interface Props {
  value: NameStyle;
  onChange: (next: NameStyle) => void;
}

/** Compact controls for placing the name. Presets + manual sliders. */
export function PositionControls({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      {/* Preset chips */}
      <div>
        <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-2">
          مكان الاسم
        </label>
        <div className="flex flex-wrap gap-2">
          {POSITION_PRESETS.map((p) => {
            const active = value.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onChange(p.apply(value))}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                  active
                    ? 'bg-brand-500 text-white shadow-brand-glow'
                    : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200 hover:bg-ink-200 dark:hover:bg-ink-700',
                )}
              >
                {p.label}
              </button>
            );
          })}
          <span
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold border-2 border-dashed',
              value.preset === 'custom'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-ink-200 dark:border-ink-700 text-ink-400',
            )}
          >
            مخصص
          </span>
        </div>
      </div>

      {/* Manual sliders */}
      <div className="grid grid-cols-2 gap-4">
        <Slider
          label="الموضع الأفقي"
          icon={<MoveVertical className="h-4 w-4 rotate-90" />}
          value={value.x}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => onChange({ ...value, x: v, preset: 'custom' })}
        />
        <Slider
          label="الموضع العمودي"
          icon={<MoveVertical className="h-4 w-4" />}
          value={value.y}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => onChange({ ...value, y: v, preset: 'custom' })}
        />
        <Slider
          label="حجم الخط"
          value={value.fontSizePct}
          min={2}
          max={8}
          step={0.1}
          unit=""
          onChange={(v) => onChange({ ...value, fontSizePct: v })}
        />
        <Slider
          label="عرض الكتلة"
          value={value.maxWidthPct}
          min={30}
          max={95}
          step={1}
          unit="%"
          onChange={(v) => onChange({ ...value, maxWidthPct: v })}
        />
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-2">
          محاذاة النص
        </label>
        <div className="inline-flex rounded-xl bg-ink-100 dark:bg-ink-800 p-1 gap-1">
          {[
            { id: 'right',  Icon: AlignRight,  label: 'يمين' },
            { id: 'center', Icon: AlignCenter, label: 'وسط' },
            { id: 'left',   Icon: AlignLeft,   label: 'يسار' },
          ].map(({ id, Icon, label }) => {
            const active = value.align === id;
            return (
              <button
                key={id}
                onClick={() => onChange({ ...value, align: id as NameStyle['align'] })}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  active
                    ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-ink-500 dark:text-ink-400 hover:bg-white/60 dark:hover:bg-ink-700/60',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color & shadow */}
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-2">
            لون الخط
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value.color}
              onChange={(e) => onChange({ ...value, color: e.target.value })}
              className="w-12 h-12 rounded-xl cursor-pointer border-2 border-ink-200 dark:border-ink-700 bg-transparent"
            />
            <div className="flex flex-col gap-1">
              {['#FFFFFF', '#0E0E10', '#F26B1F', '#A93F09'].map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...value, color: c })}
                  className="w-6 h-6 rounded-md border border-ink-200 dark:border-ink-700"
                  style={{ background: c }}
                  aria-label={`اختر اللون ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!value.shadow}
            onChange={(e) => onChange({ ...value, shadow: e.target.checked })}
            className="h-5 w-5 accent-brand-500"
          />
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
            ظل خفيف خلف النص
          </span>
        </label>
      </div>
    </div>
  );
}

function Slider({
  label,
  icon,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-ink-500 dark:text-ink-400 inline-flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        <span className="text-xs font-mono text-ink-400">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-brand-500"
      />
    </div>
  );
}

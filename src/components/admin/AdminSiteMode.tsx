'use client';

import { Sparkles, Check } from 'lucide-react';
import { useActiveOccasion } from '@/templates/activeOccasion';
import { OCCASIONS } from '@/templates/types';

/**
 * Top-of-admin panel that lets the admin set the active site mood.
 *
 * Selecting an occasion immediately updates:
 *   - The homepage hero (title, subtitle, accent gradient orbs).
 *   - The default gallery filter (visitors land on the matching tab).
 *   - The active-mode badge here in the admin.
 *
 * Persisted via localStorage so a single browser remembers the choice;
 * swap the storage layer in `templates/activeOccasion.ts` for an API call
 * if you need cross-device sync.
 */
export function AdminSiteMode() {
  const { occasionKey, occasion, setActive } = useActiveOccasion();

  return (
    <div
      className="card-surface p-5 sm:p-6 border-2"
      style={{ borderColor: occasion.color + '40' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <span
            className="grid place-items-center w-11 h-11 rounded-2xl shrink-0"
            style={{ background: occasion.bg, color: occasion.color }}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-extrabold text-ink-900 dark:text-ink-50">
              هوية الواجهة الحالية
            </h3>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
              اختر المناسبة الفعّالة الآن. الصفحة الرئيسية ستتحوّل تلقائياً.
            </p>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ background: occasion.color, color: '#FFFFFF' }}
        >
          <span>الحالية: {occasion.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {OCCASIONS.map((o) => {
          const active = o.key === occasionKey;
          return (
            <button
              key={o.key}
              onClick={() => setActive(o.key)}
              className="group relative rounded-2xl p-3 text-right transition-all border-2 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: active ? o.color : o.bg,
                borderColor: active ? o.color : 'transparent',
                color: active ? '#FFFFFF' : '#1A1A1D',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">{o.title}</div>
                  <div
                    className="text-[10px] mt-0.5 truncate"
                    style={{ color: active ? 'rgba(255,255,255,0.85)' : '#5B5B63' }}
                  >
                    {o.tagline}
                  </div>
                </div>
                {active && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

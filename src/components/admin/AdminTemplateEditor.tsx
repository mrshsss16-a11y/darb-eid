'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Save, Trash2, EyeOff, Eye, Loader2 } from 'lucide-react';
import { TemplateCanvas } from '@/components/TemplateCanvas';
import { PositionControls } from '@/components/editor/PositionControls';
import { FormatSwitch } from '@/components/editor/FormatSwitch';
import { useTemplates } from '@/templates/store';
import type { NameStyle, CanvasFormat } from '@/templates/types';
import { FORMAT_DIMENSIONS, getFormatNameStyle, updateFormatNameStyle } from '@/templates/types';
import { seedTemplates } from '@/templates/seed';

interface Props {
  templateId: string;
  onDeleted?: () => void;
}

/**
 * Visual editor for tuning a template's default name placement and meta.
 * Supports size toggling (Square, Story, Post) to set positions for each format.
 */
export function AdminTemplateEditor({ templateId, onDeleted }: Props) {
  const { templates, upsertOverride, deleteTemplate, restoreTemplate } = useTemplates({
    includeHidden: true,
  });
  const template = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );

  const [title, setTitle] = useState(template?.title ?? '');
  const [style, setStyle] = useState<NameStyle | null>(
    template ? { ...template.defaultNameStyle } : null,
  );
  const [format, setFormat] = useState<CanvasFormat>('square');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setStyle({ ...template.defaultNameStyle });
    }
  }, [template]);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [previewWidth, setPreviewWidth] = useState(420);

  // Dynamic preview width computation
  useEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) return;

    const recompute = () => {
      const dims = FORMAT_DIMENSIONS[format];
      const wRaw = wrap.clientWidth;
      const wPadded = wRaw > 40 ? wRaw - 32 : 320;
      const maxW = Math.min(wPadded, 500);
      const maxH = Math.min(window.innerHeight * 0.55, format === 'story' ? 640 : 500);
      const wByHeight = maxH * (dims.w / dims.h);
      const px = Math.max(160, Math.min(maxW, wByHeight));
      setPreviewWidth(Math.round(px));
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(wrap);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [format]);

  const dims = FORMAT_DIMENSIONS[format];
  const previewHeight = (previewWidth / dims.w) * dims.h;

  const activeStyle = useMemo(() => {
    return style ? getFormatNameStyle(style, format) : null;
  }, [style, format]);

  const onStyleChange = (nextActiveStyle: NameStyle) => {
    if (!style) return;
    const updated = updateFormatNameStyle(style, format, nextActiveStyle);
    setStyle(updated);
  };

  const onPreviewClick = (e: React.MouseEvent) => {
    if (!previewRef.current || !style || !activeStyle) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onStyleChange({
      ...activeStyle,
      x: clampedX,
      y: clampedY,
      preset: 'custom',
    });
  };

  if (!template || !style || !activeStyle) {
    return (
      <div className="card-surface p-8 text-center text-ink-500">
        اختر قالباً من القائمة على اليمين لبدء التعديل.
      </div>
    );
  }

  const isSeed = seedTemplates.some((t) => t.id === template.id);

  const onSave = async () => {
    setSaving(true);
    await upsertOverride(template.id, { title, defaultNameStyle: style });
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  const onDelete = () => {
    const msg = isSeed
      ? `سيتم إخفاء القالب "${template.title}" من الواجهة العامة. تقدر تستعيده بزر "إظهار" بعدها. هل تريد المتابعة؟`
      : `سيتم حذف القالب "${template.title}" نهائياً. هل أنت متأكد؟`;
    if (!window.confirm(msg)) return;
    deleteTemplate(template.id);
    onDeleted?.();
  };

  const onRestore = () => {
    restoreTemplate(template.id);
  };

  const isHidden = (template as any).isHidden as boolean | undefined;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
      <div className="card-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900 dark:text-ink-50">
              {template.title}
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">
              اختر المقاس ثم انقر على المعاينة لتغيير موضع الاسم بصرياً
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FormatSwitch value={format} onChange={setFormat} />
            <div className="flex items-center gap-2">
              {savedAt && (
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                  تم الحفظ ✓
                </span>
              )}
              <button onClick={onSave} className="btn-primary" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>حفظ</span>
              </button>
              {isHidden ? (
                <button
                  onClick={onRestore}
                  className="btn-ghost text-green-600 hover:text-green-700"
                  title="إظهار في الواجهة العامة"
                >
                  <Eye className="h-4 w-4" />
                  <span>إظهار</span>
                </button>
              ) : (
                <button
                  onClick={onDelete}
                  className="btn-ghost text-red-600 hover:text-red-700"
                  title={isSeed ? 'إخفاء من الواجهة العامة' : 'حذف القالب نهائياً'}
                >
                  {isSeed ? <EyeOff className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  <span>{isSeed ? 'إخفاء' : 'حذف'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {isHidden && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink-300 dark:border-ink-700 bg-ink-50 dark:bg-ink-900/50 p-3 text-sm">
            <EyeOff className="h-5 w-5 text-ink-500 shrink-0" />
            <p className="text-ink-700 dark:text-ink-200">
              هذا القالب <strong>مخفي</strong> ولا يظهر للموظفين. استخدم زر "إظهار" لإعادته للواجهة العامة.
            </p>
          </div>
        )}

        <div
          ref={previewWrapRef}
          className="bg-ink-100 dark:bg-ink-900 rounded-2xl p-4 flex items-center justify-center min-h-[440px] relative overflow-hidden"
        >
          <div
            ref={previewRef}
            onClick={onPreviewClick}
            className="relative cursor-crosshair"
            style={{ width: previewWidth, height: previewHeight }}
          >
            <TemplateCanvas
              template={template}
              employeeName="اسم الموظف · Employee Name"
              format={format}
              nameStyle={activeStyle}
              pixelWidth={previewWidth}
            />
            {/* Crosshair indicator */}
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${activeStyle.x}%`,
                top: `${activeStyle.y}%`,
                transform: 'translate(-50%,-50%)',
              }}
            >
              <div className="w-6 h-6 rounded-full border-2 border-brand-500 bg-brand-500/30 shadow-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card-surface p-5">
          <label className="block text-sm font-bold text-ink-700 dark:text-ink-200 mb-2">
            عنوان القالب
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="card-surface p-5">
          <h3 className="font-display font-extrabold text-ink-900 dark:text-ink-50 mb-4 flex items-center gap-2">
            <span>إعدادات الاسم للمقاس:</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded text-sm">
              {FORMAT_DIMENSIONS[format].label.split(' — ')[0]}
            </span>
          </h3>
          <PositionControls value={activeStyle} onChange={onStyleChange} />
        </div>
      </div>
    </div>
  );
}


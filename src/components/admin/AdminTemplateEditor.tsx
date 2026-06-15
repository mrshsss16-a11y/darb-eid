'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Save, RotateCcw, Trash2, EyeOff, Eye } from 'lucide-react';
import { TemplateCanvas } from '@/components/TemplateCanvas';
import { PositionControls } from '@/components/editor/PositionControls';
import { useTemplates } from '@/templates/store';
import type { NameStyle } from '@/templates/types';
import { FORMAT_DIMENSIONS } from '@/templates/types';
import { seedTemplates } from '@/templates/seed';

interface Props {
  templateId: string;
  onDeleted?: () => void;
}

/**
 * Visual editor for tuning a template's default name placement and meta.
 * Click-to-place positioning + numeric controls.
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
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setStyle({ ...template.defaultNameStyle });
    }
  }, [template]);

  // Click-to-place on the preview surface.
  const previewRef = useRef<HTMLDivElement | null>(null);
  const onPreviewClick = (e: React.MouseEvent) => {
    if (!previewRef.current || !style) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setStyle({ ...style, x, y, preset: 'custom' });
  };

  if (!template || !style) {
    return (
      <div className="card-surface p-8 text-center text-ink-500">
        اختر قالباً من القائمة على اليمين لبدء التعديل.
      </div>
    );
  }

  const isSeed = seedTemplates.some((t) => t.id === template.id);
  const dims = FORMAT_DIMENSIONS.square;

  const onSave = () => {
    upsertOverride(template.id, { title, defaultNameStyle: style });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  const onReset = () => {
    const seed = seedTemplates.find((t) => t.id === template.id);
    if (seed) {
      setTitle(seed.title);
      setStyle({ ...seed.defaultNameStyle });
      upsertOverride(template.id, {
        title: seed.title,
        defaultNameStyle: seed.defaultNameStyle,
      });
    }
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900 dark:text-ink-50">
              {template.title}
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">
              انقر على المعاينة لتغيير موضع الاسم بصرياً
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                تم الحفظ ✓
              </span>
            )}
            <button onClick={onSave} className="btn-primary">
              <Save className="h-4 w-4" />
              <span>حفظ</span>
            </button>
            {isSeed && (
              <button onClick={onReset} className="btn-ghost" title="استعادة الإعدادات الافتراضية">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
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

        {isHidden && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink-300 dark:border-ink-700 bg-ink-50 dark:bg-ink-900/50 p-3 text-sm">
            <EyeOff className="h-5 w-5 text-ink-500 shrink-0" />
            <p className="text-ink-700 dark:text-ink-200">
              هذا القالب <strong>مخفي</strong> ولا يظهر للموظفين. استخدم زر "إظهار" لإعادته للواجهة العامة.
            </p>
          </div>
        )}

        <div
          ref={previewRef}
          onClick={onPreviewClick}
          className="bg-ink-100 dark:bg-ink-900 rounded-2xl p-4 flex items-center justify-center cursor-crosshair relative"
          style={{ minHeight: 400 }}
        >
          <TemplateCanvas
            template={template}
            employeeName="اسم الموظف · Employee Name"
            format="square"
            nameStyle={style}
            pixelWidth={420}
          />
          {/* Crosshair indicator */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: `calc(${style.x}% + 0px)`,
              top: `calc(${style.y}% + 0px)`,
              transform: 'translate(-50%,-50%)',
            }}
          >
            <div className="w-6 h-6 rounded-full border-2 border-brand-500 bg-brand-500/30" />
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
          <h3 className="font-display font-extrabold text-ink-900 dark:text-ink-50 mb-4">
            إعدادات الاسم الافتراضية
          </h3>
          <PositionControls value={style} onChange={setStyle} />
        </div>
      </div>
    </div>
  );
}

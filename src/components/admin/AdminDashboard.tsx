'use client';

import { useState } from 'react';
import { Trash2, RotateCcw, EyeOff, Plus, Pencil } from 'lucide-react';
import { useTemplates } from '@/templates/store';
import { TemplateCanvas } from '@/components/TemplateCanvas';
import { getFormatNameStyle } from '@/templates/types';
import { AdminTemplateEditor } from './AdminTemplateEditor';
import { AdminUploader } from './AdminUploader';
import { AdminDiagnostic } from './AdminDiagnostic';
import { AdminSiteMode } from './AdminSiteMode';
import { AdminHeroEditor } from './AdminHeroEditor';
import { cn } from '@/utils/cn';

export function AdminDashboard() {
  // Admin sees everything, including hidden seed templates.
  const { templates, ready, deleteTemplate, restoreTemplate } = useTemplates({
    includeHidden: true,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(true);

  if (!ready) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-ink-500">جارٍ التحميل…</div>;
  }

  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const visibleCount = templates.filter((t) => !t.isHidden).length;
  const hiddenCount = templates.length - visibleCount;

  const onDelete = (id: string, title: string, isSeed: boolean) => {
    const msg = isSeed
      ? `سيتم إخفاء القالب "${title}" من الواجهة العامة. تقدر تستعيده لاحقاً من نفس الصفحة. هل تريد المتابعة؟`
      : `سيتم حذف القالب "${title}" نهائياً. هل أنت متأكد؟`;
    if (!window.confirm(msg)) return;
    deleteTemplate(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 page-enter">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 dark:text-ink-50">
            لوحة إدارة القوالب
          </h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400">
            أضف قوالب جديدة، عدّل العناوين والمواضع، أو احذف ما لا تريد.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="label-tag">{visibleCount} قالب ظاهر</span>
            {hiddenCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300">
                <EyeOff className="h-3 w-3" />
                {hiddenCount} مخفي
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setShowUploader((v) => !v)} className="btn-primary">
          <Plus className="h-5 w-5" />
          <span>{showUploader ? 'إغلاق الرفع' : 'إضافة قالب جديد'}</span>
        </button>
      </header>

      <AdminSiteMode />

      <AdminHeroEditor />

      {showUploader && <AdminUploader />}

      <AdminDiagnostic />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Templates list */}
        <aside className="card-surface p-3 max-h-[80vh] overflow-y-auto">
          <h2 className="font-display font-extrabold text-ink-900 dark:text-ink-50 mb-3 px-2 pt-1">
            القوالب ({templates.length})
          </h2>
          <ul className="space-y-1.5">
            {templates.map((t) => {
              const active = t.id === selectedId;
              return (
                <li key={t.id}>
                  <div
                    className={cn(
                      'group flex items-center gap-2 p-2 rounded-xl transition-colors relative',
                      active
                        ? 'bg-brand-50 dark:bg-brand-900/30'
                        : 'hover:bg-ink-50 dark:hover:bg-ink-800',
                      t.isHidden && 'opacity-60',
                    )}
                  >
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className="flex-1 flex items-center gap-3 min-w-0 text-right"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-ink-100 dark:bg-ink-900 shrink-0 relative">
                        <TemplateCanvas
                          template={t}
                          employeeName=""
                          format="square"
                          nameStyle={getFormatNameStyle(t.defaultNameStyle, 'square')}
                          pixelWidth={48}
                        />
                        {t.isHidden && (
                          <div className="absolute inset-0 grid place-items-center bg-black/40">
                            <EyeOff className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn(
                          'font-bold text-sm truncate',
                          active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-800 dark:text-ink-100',
                        )}>
                          {t.title}
                        </div>
                        <div className="text-[10px] text-ink-400 truncate flex items-center gap-1.5">
                          {t.isSeed ? (
                            <span className="px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500">
                              أصلي
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-900/30 text-brand-600">
                              مرفوع
                            </span>
                          )}
                          <span className="truncate">{t.id}</span>
                        </div>
                      </div>
                    </button>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedId(t.id)}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-ink-700 text-ink-500 hover:text-brand-600"
                        title="تعديل"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {t.isHidden ? (
                        <button
                          onClick={() => restoreTemplate(t.id)}
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-ink-700 text-green-600 hover:text-green-700"
                          title="استعادة"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onDelete(t.id, t.title, t.isSeed)}
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-ink-700 text-red-500 hover:text-red-600"
                          title={t.isSeed ? 'إخفاء' : 'حذف'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {templates.length === 0 && (
            <div className="text-center py-12 text-ink-400 text-sm">
              لا توجد قوالب بعد. ابدأ بإضافة قالب جديد.
            </div>
          )}
        </aside>

        {/* Editor */}
        <section>
          {selected ? (
            <AdminTemplateEditor
              templateId={selected.id}
              onDeleted={() => setSelectedId(null)}
            />
          ) : (
            <div className="card-surface p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-ink-100 dark:bg-ink-800 grid place-items-center mb-4">
                <Pencil className="h-7 w-7 text-ink-400" />
              </div>
              <p className="text-ink-500 dark:text-ink-400">
                اختر قالباً من القائمة على اليمين لتعديله، أو أضف قالباً جديداً من الزر بالأعلى.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

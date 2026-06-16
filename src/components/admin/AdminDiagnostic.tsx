'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { useTemplates } from '@/templates/store';

/**
 * Diagnostic panel — reads from the templates store (connected to Supabase) and
 * shows what's actually persisted. Use this to verify that uploaded images are
 * saved + readable.
 */
interface Row {
  id: string;
  title: string;
  kind: string;
  urlLength: number;
  urlPrefix: string;
  validHeader: boolean;
  loaded: boolean | null;
  error: string | null;
}

export function AdminDiagnostic() {
  const { templates, resetAll } = useTemplates({ includeHidden: true });
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);

  const customTemplates = templates.filter(t => !t.isSeed);
  const totalSize = customTemplates.reduce((acc, t) => {
    let size = t.customImage?.length || 0;
    if (t.customImages) {
      Object.values(t.customImages).forEach((img: any) => {
        if (img) size += img.length;
      });
    }
    return acc + size;
  }, 0);

  const refresh = () => {
    try {
      const next: Row[] = customTemplates.map((t: any) => {
        const url: string = t?.customImage ?? '';
        return {
          id: t?.id ?? '<no id>',
          title: t?.title ?? '<no title>',
          kind: 'custom',
          urlLength: url.length,
          urlPrefix: url.slice(0, 35),
          validHeader: url.startsWith('data:image/') || url.startsWith('http'),
          loaded: null,
          error: null,
        };
      });
      setRows(next);
    } catch (e) {
      setRows([]);
    }
  };

  useEffect(() => {
    if (open) refresh();
  }, [open, templates]);

  const deleteAllCustom = async () => {
    if (!window.confirm('سيتم حذف جميع القوالب المرفوعة من قاعدة البيانات. متأكد؟')) return;
    await resetAll();
    window.location.reload();
  };

  if (!open) {
    return (
      <div className="card-surface p-4">
        <button
          onClick={() => setOpen(true)}
          className="btn-ghost text-sm w-full justify-center"
        >
          <AlertCircle className="h-4 w-4" />
          <span>أداة التشخيص — فتح لمراجعة البيانات المحفوظة</span>
        </button>
      </div>
    );
  }

  return (
    <div className="card-surface p-5 space-y-4 border-2 border-dashed border-brand-300">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display font-extrabold text-ink-900 dark:text-ink-50">
          أداة التشخيص
        </h3>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-ghost text-sm" title="تحديث">
            <RefreshCw className="h-4 w-4" />
            <span>تحديث</span>
          </button>
          <button onClick={() => setOpen(false)} className="btn-ghost text-sm">إغلاق</button>
        </div>
      </div>

      <div className="text-xs text-ink-500 dark:text-ink-400 space-y-1">
        <div>حجم بيانات الصور المرفوعة: <span className="font-mono">{(totalSize / 1024).toFixed(1)} KB</span></div>
        <div>عدد القوالب المرفوعة: <span className="font-mono">{rows.length}</span></div>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-ink-500 dark:text-ink-400 p-4 bg-ink-50 dark:bg-ink-900 rounded-xl text-center">
          لا توجد قوالب مرفوعة محفوظة في قاعدة البيانات.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <DiagnosticRow key={r.id} row={r} customTemplates={customTemplates} />
          ))}
        </div>
      )}

      <div className="border-t border-ink-200 dark:border-ink-700 pt-4">
        <button onClick={deleteAllCustom} className="btn-ghost text-red-600 hover:text-red-700 text-sm">
          <Trash2 className="h-4 w-4" />
          <span>حذف جميع القوالب المرفوعة (تنظيف كامل)</span>
        </button>
      </div>
    </div>
  );
}

function DiagnosticRow({ row, customTemplates }: { row: Row; customTemplates: any[] }) {
  const [loaded, setLoaded] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = customTemplates.find((x) => x?.id === row.id);
      setImgUrl(t?.customImage ?? null);
    } catch (e) {
      setError(String(e));
    }
  }, [row.id, customTemplates]);

  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-700 p-3">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-ink-100 dark:bg-ink-900 shrink-0 grid place-items-center">
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt=""
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(false)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <span className="text-xs text-ink-400">لا يوجد</span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-xs space-y-1">
          <div className="font-bold text-ink-800 dark:text-ink-100 text-sm truncate">
            {row.title}
          </div>
          <div className="font-mono text-ink-500 truncate">{row.id}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span className="text-ink-400">نوع القالب:</span>
            <span className="font-mono text-ink-700 dark:text-ink-200">{row.kind}</span>
            <span className="text-ink-400">المقاسات المتوفرة:</span>
            <span className="font-mono text-ink-700 dark:text-ink-200">
              {(() => {
                const t = customTemplates.find((x) => x?.id === row.id);
                if (t?.customImages) {
                  return Object.keys(t.customImages).filter(k => t.customImages[k]).join(', ');
                }
                return 'square';
              })()}
            </span>
            <span className="text-ink-400">طول الـ URL (الأساسي):</span>
            <span className="font-mono text-ink-700 dark:text-ink-200">{row.urlLength.toLocaleString()}</span>
            <span className="text-ink-400">رأس صحيح؟</span>
            <span className={row.validHeader ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {row.validHeader ? 'نعم ✓' : 'لا ✗'}
            </span>
            <span className="text-ink-400">يتحمّل في المتصفح؟</span>
            <span className={
              loaded === true ? 'text-green-600 font-bold' :
              loaded === false ? 'text-red-600 font-bold' :
              'text-ink-400'
            }>
              {loaded === true ? 'نعم ✓' : loaded === false ? 'فشل ✗' : '⋯'}
            </span>
          </div>
          {error && (
            <div className="mt-2 text-red-600 text-[10px]">خطأ: {error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

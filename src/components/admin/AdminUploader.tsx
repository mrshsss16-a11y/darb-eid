'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Upload, ImageIcon, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTemplates, StorageQuotaError } from '@/templates/store';
import type { StoredTemplate, OccasionKey } from '@/templates/types';
import { OCCASIONS } from '@/templates/types';
import { compressImageFile, formatBytes, type CompressedImage } from '@/utils/imageProcessing';

/**
 * Lets the admin upload a background image and turn it into a new template.
 *
 * UX flow:
 *  1. Pick (or drag) a file → we resize/compress to JPEG (≤ ~1600px, q=0.86)
 *     so it fits comfortably in localStorage even after a few uploads.
 *  2. Show a preview + the original/compressed sizes so the admin sees what
 *     they're actually saving.
 *  3. Title auto-fills from the filename; admin can rename before saving.
 *  4. "حفظ القالب" persists it via the store. We surface specific errors
 *     (file too big, not an image, quota full) in Arabic.
 */
export function AdminUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [preview, setPreview] = useState<CompressedImage | null>(null);
  const [originalBytes, setOriginalBytes] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [occasionKey, setOccasionKey] = useState<OccasionKey>('eid-adha');

  const { addCustomTemplate } = useTemplates({ includeHidden: true });

  const reset = () => {
    setPreview(null);
    setOriginalBytes(null);
    setError(null);
    setTitle('');
    setDone(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setError(null);
    setDone(null);

    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة. اختر ملف بصيغة PNG أو JPG أو WebP.');
      return;
    }
    // Reject only truly massive files (Canvas API can choke past ~20 MB);
    // anything under that we'll compress.
    if (file.size > 20 * 1024 * 1024) {
      setError(`حجم الملف ${formatBytes(file.size)} كبير جداً. الحد الأقصى 20 ميجابايت.`);
      return;
    }

    setBusy(true);
    setOriginalBytes(file.size);
    try {
      const compressed = await compressImageFile(file);
      setPreview(compressed);
      // Auto-fill title from filename if empty.
      if (!title.trim()) {
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
        setTitle(base || 'قالب جديد');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل قراءة الصورة.');
    } finally {
      setBusy(false);
    }
  };

  const onPick = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const onSave = () => {
    if (!preview) {
      setError('اختر صورة أولاً.');
      return;
    }
    const cleanTitle = (title.trim() || 'قالب جديد').slice(0, 100);

    const occMeta = OCCASIONS.find((o) => o.key === occasionKey) ?? OCCASIONS[0];
    const payload: StoredTemplate = {
      id: `custom-${Date.now()}`,
      title: cleanTitle,
      occasion: occMeta.title,
      occasionKey: occasionKey,
      // bg = neutral cream (NOT white) so the canvas edge is visible even
      // before/while the image loads. accent stays brand orange.
      palette: { accent: '#F26B1F', bg: '#F5E6D3' },
      defaultNameStyle: {
        x: 50, y: 78, align: 'center',
        fontSizePct: 4.2,
        // Brand orange — readable on most uploaded artwork AND on the
        // neutral cream bg if the image hasn't loaded yet. Users can change
        // it via the colour picker in the editor.
        color: '#A93F09',
        maxWidthPct: 75,
        preset: 'bottom', weight: 700, shadow: true,
      },
      source: { kind: 'custom', imageDataUrl: preview.dataUrl },
    };

    try {
      addCustomTemplate(payload);
      setDone(`تمت إضافة "${cleanTitle}" بنجاح`);
      setPreview(null);
      setOriginalBytes(null);
      setTitle('');
      if (inputRef.current) inputRef.current.value = '';
      setTimeout(() => setDone(null), 4000);
    } catch (err) {
      if (err instanceof StorageQuotaError) {
        setError(
          'الذاكرة المحلية ممتلئة. احذف قالب مرفوع قديم من القائمة بالأسفل ثم حاول مرة ثانية. ' +
          '(ملاحظة: المتصفح يخزن القوالب محلياً بحد ~5 ميجابايت — للاستخدام الموسّع اربط المنصة بقاعدة بيانات حقيقية)',
        );
      } else {
        setError('فشل حفظ القالب: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
      }
    }
  };

  return (
    <div className="card-surface p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 shrink-0">
          <ImageIcon className="h-6 w-6" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-extrabold text-ink-900 dark:text-ink-50">
            رفع قالب جديد
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            ارفع صورة خلفية (PNG / JPG / WebP). سيتم تصغيرها وضغطها تلقائياً
            بحيث تناسب التخزين المحلي. اسحب الملف هنا أو اضغط الزر.
          </p>

          {/* Drop zone (always present when no preview) */}
          {!preview && (
            <div
              onClick={onPick}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`mt-4 cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 text-center
                ${dragging
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.01]'
                  : 'border-ink-200 dark:border-ink-700 hover:border-brand-400 hover:bg-ink-50 dark:hover:bg-ink-800/50'
                }`}
            >
              {busy ? (
                <div className="flex flex-col items-center gap-2 text-ink-500">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                  <span className="text-sm font-medium">جارٍ معالجة الصورة…</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-ink-500 dark:text-ink-400">
                  <Upload className="h-8 w-8 text-brand-500" />
                  <span className="text-sm font-bold text-ink-700 dark:text-ink-200">
                    اضغط للاختيار أو اسحب الصورة هنا
                  </span>
                  <span className="text-xs">
                    PNG · JPG · WebP — حتى 20 ميجابايت (يتم الضغط تلقائياً)
                  </span>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onFile}
                className="hidden"
              />
            </div>
          )}

          {/* Preview + final save */}
          {preview && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 rounded-2xl border border-ink-200 dark:border-ink-700 p-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 dark:bg-ink-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.dataUrl} alt="معاينة" className="w-full h-full object-cover" />
                <button
                  onClick={reset}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  title="إلغاء"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-1.5">
                    عنوان القالب
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="مثال: زخرفة كلاسيكية"
                    maxLength={100}
                    className="input-field !py-3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-1.5">
                    المناسبة
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {OCCASIONS.map((o) => {
                      const active = o.key === occasionKey;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setOccasionKey(o.key)}
                          className="text-xs font-bold rounded-lg px-2.5 py-1.5 transition-all border-2"
                          style={{
                            background: active ? o.color : o.bg,
                            color: active ? '#FFFFFF' : '#1A1A1D',
                            borderColor: active ? o.color : 'transparent',
                          }}
                        >
                          {o.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-xs text-ink-500 dark:text-ink-400 grid grid-cols-2 gap-2">
                  {originalBytes != null && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-400">الأصل</div>
                      <div className="font-mono">{formatBytes(originalBytes)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400">بعد الضغط</div>
                    <div className="font-mono text-green-600 dark:text-green-400">
                      {formatBytes(preview.bytes)} · {preview.width}×{preview.height}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button onClick={onSave} className="btn-primary flex-1" disabled={busy}>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>حفظ القالب</span>
                  </button>
                  <button onClick={reset} className="btn-ghost">
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 p-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-green-700 dark:text-green-300">{done}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Upload, ImageIcon, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTemplates, StorageQuotaError } from '@/templates/store';
import type { StoredTemplate, OccasionKey, CanvasFormat } from '@/templates/types';
import { OCCASIONS } from '@/templates/types';
import { compressImageFile, formatBytes, type CompressedImage } from '@/utils/imageProcessing';
import { useTheme } from '@/components/ThemeProvider';

export function AdminUploader() {
  const { theme } = useTheme();
  
  const squareInputRef = useRef<HTMLInputElement | null>(null);
  const storyInputRef = useRef<HTMLInputElement | null>(null);
  const postInputRef = useRef<HTMLInputElement | null>(null);
  
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [occasionKey, setOccasionKey] = useState<OccasionKey>('eid-adha');
  const [draggingFormat, setDraggingFormat] = useState<CanvasFormat | null>(null);

  const [previews, setPreviews] = useState<Record<CanvasFormat, CompressedImage | null>>({
    square: null,
    story: null,
    post: null,
  });

  const [originalSizes, setOriginalSizes] = useState<Record<CanvasFormat, number | null>>({
    square: null,
    story: null,
    post: null,
  });

  const { addCustomTemplate } = useTemplates({ includeHidden: true });

  const reset = () => {
    setPreviews({ square: null, story: null, post: null });
    setOriginalSizes({ square: null, story: null, post: null });
    setError(null);
    setTitle('');
    setDone(null);
    setDraggingFormat(null);
    if (squareInputRef.current) squareInputRef.current.value = '';
    if (storyInputRef.current) storyInputRef.current.value = '';
    if (postInputRef.current) postInputRef.current.value = '';
  };

  const processFile = async (file: File, format: CanvasFormat) => {
    setError(null);
    setDone(null);

    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة. اختر ملف بصيغة PNG أو JPG أو WebP.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(`حجم الملف ${formatBytes(file.size)} كبير جداً. الحد الأقصى 20 ميجابايت.`);
      return;
    }

    setBusy(true);
    setOriginalSizes((prev) => ({ ...prev, [format]: file.size }));
    try {
      const compressed = await compressImageFile(file);
      setPreviews((prev) => ({ ...prev, [format]: compressed }));
      
      // Auto-fill title from filename if empty and it's the square/base format
      if (!title.trim() && format === 'square') {
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
        setTitle(base || 'قالب جديد');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل قراءة الصورة.');
    } finally {
      setBusy(false);
    }
  };

  const onPick = (format: CanvasFormat) => {
    if (format === 'square') squareInputRef.current?.click();
    else if (format === 'story') storyInputRef.current?.click();
    else if (format === 'post') postInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, format: CanvasFormat) => {
    const f = e.target.files?.[0];
    if (f) processFile(f, format);
  };

  const onSave = async () => {
    if (!previews.square) {
      setError('يجب اختيار الصورة الأساسية (المقاس المربع) أولاً.');
      return;
    }
    const cleanTitle = (title.trim() || 'قالب جديد').slice(0, 100);
    const occMeta = OCCASIONS.find((o) => o.key === occasionKey) ?? OCCASIONS[0];

    const payload: StoredTemplate = {
      id: `custom-${Date.now()}`,
      title: cleanTitle,
      occasion: occMeta.title,
      occasionKey: occasionKey,
      palette: { accent: '#F26B1F', bg: '#F5E6D3' },
      defaultNameStyle: {
        x: 50, y: 78, align: 'center',
        fontSizePct: 4.2,
        color: '#A93F09',
        maxWidthPct: 75,
        preset: 'bottom', weight: 700, shadow: true,
      },
      source: {
        kind: 'custom',
        imageDataUrl: previews.square.dataUrl,
        images: {
          square: previews.square.dataUrl,
          story: previews.story?.dataUrl || undefined,
          post: previews.post?.dataUrl || undefined,
        },
      },
    };

    try {
      await addCustomTemplate(payload);
      setDone(`تمت إضافة "${cleanTitle}" بنجاح`);
      reset();
      setTimeout(() => setDone(null), 4000);
    } catch (err) {
      if (err instanceof StorageQuotaError) {
        setError(
          'الذاكرة المحلية ممتلئة. احذف قالب مرفوع قديم من القائمة بالأسفل ثم حاول مرة ثانية.'
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
            رفع قالب جديد لكل المقاسات
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            قم بتعبئة بيانات القالب وارفع خلفية لكل مقاس من المقاسات الثلاثة لتحقيق دقة عرض مثالية.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title Input */}
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

            {/* Occasion Selection */}
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
                        background: active ? o.color : (o.darkBg && theme === 'dark' ? o.darkBg : o.bg),
                        color: active ? '#FFFFFF' : (theme === 'dark' ? '#E4E4E7' : '#1A1A1D'),
                        borderColor: active ? o.color : 'transparent',
                      }}
                    >
                      {o.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3 Upload Areas Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['square', 'story', 'post'] as CanvasFormat[]).map((fmt) => {
              const preview = previews[fmt];
              const origBytes = originalSizes[fmt];
              const isDragging = draggingFormat === fmt;
              
              let label = 'مربع (1:1)';
              let badge = 'أساسي';
              let badgeStyle = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
              let aspectClass = 'aspect-square';
              
              if (fmt === 'story') {
                label = 'ستوري (9:16)';
                badge = 'اختياري';
                badgeStyle = 'bg-ink-100 text-ink-600 dark:bg-ink-850 dark:text-ink-400';
                aspectClass = 'aspect-[9/16]';
              } else if (fmt === 'post') {
                label = 'منشور (1.91:1)';
                badge = 'اختياري';
                badgeStyle = 'bg-ink-100 text-ink-600 dark:bg-ink-850 dark:text-ink-400';
                aspectClass = 'aspect-[1.91/1]';
              }

              return (
                <div key={fmt} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-700 dark:text-ink-300">{label}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
                      {badge}
                    </span>
                  </div>

                  {/* Upload box */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDraggingFormat(fmt); }}
                    onDragLeave={() => setDraggingFormat(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingFormat(null);
                      const f = e.dataTransfer.files?.[0];
                      if (f) processFile(f, fmt);
                    }}
                    onClick={() => {
                      if (!preview) onPick(fmt);
                    }}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center p-4 text-center ${aspectClass}
                      ${preview 
                        ? 'border-ink-200 dark:border-ink-700 hover:border-brand-400' 
                        : isDragging
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.01]'
                          : 'border-ink-200 dark:border-ink-700 hover:border-brand-400 hover:bg-ink-50 dark:hover:bg-ink-800/50'
                      }`}
                  >
                    {preview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview.dataUrl} alt={label} className="absolute inset-0 w-full h-full object-cover z-0" />
                        <div className="absolute inset-0 bg-black/40 z-10 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviews((p) => ({ ...p, [fmt]: null }));
                              setOriginalSizes((s) => ({ ...s, [fmt]: null }));
                            }}
                            className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors"
                            title="إلغاء"
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <span className="text-[10px] text-white font-mono bg-black/60 px-1.5 py-0.5 rounded">
                            {preview.width}×{preview.height}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-ink-500 dark:text-ink-400 z-10 w-full h-full justify-center">
                        <Upload className="h-6 w-6 text-brand-500" />
                        <span className="text-[11px] font-bold text-ink-700 dark:text-ink-200">
                          اضغط للرفع أو اسحب هنا
                        </span>
                        <span className="text-[9px] text-ink-400">
                          PNG · JPG · WebP
                        </span>
                      </div>
                    )}
                  </div>

                  {preview && (
                    <div className="text-[10px] font-mono text-ink-500 dark:text-ink-400 text-center">
                      {origBytes != null ? formatBytes(origBytes) : ''} → <span className="text-green-600 dark:text-green-400">{formatBytes(preview.bytes)}</span>
                    </div>
                  )}

                  <input
                    ref={fmt === 'square' ? squareInputRef : fmt === 'story' ? storyInputRef : postInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => onFileChange(e, fmt)}
                    className="hidden"
                  />
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-6 justify-end border-t border-ink-100 dark:border-ink-800 pt-4">
            <button onClick={reset} className="btn-ghost">
              إعادة تعيين
            </button>
            <button onClick={onSave} className="btn-primary" disabled={busy || !previews.square}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>حفظ القالب</span>
            </button>
          </div>

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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw, Save, Paintbrush, ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { useActiveOccasion } from '@/templates/activeOccasion';
import { useHeroOverrides, type HeroOverride } from '@/templates/heroCustomization';
import { OCCASIONS, type OccasionKey } from '@/templates/types';
import { compressImageFile, formatBytes } from '@/utils/imageProcessing';

/**
 * Full hero editor — admin tweaks copy + colours per occasion with a live
 * preview. The hero on `/` updates in real time as values change.
 */
export function AdminHeroEditor() {
  const { occasionKey: activeKey, setActive } = useActiveOccasion();
  const { setOverride, resetOccasion, getResolved, hydrated } = useHeroOverrides();

  // Which occasion are we currently editing? Defaults to the active site mode
  // so the editing context matches what the public will see.
  const [editingKey, setEditingKey] = useState<OccasionKey>(activeKey);
  useEffect(() => { setEditingKey(activeKey); }, [activeKey]);

  const resolved = getResolved(editingKey);

  // Local form state, seeded from the currently-resolved values so the form
  // shows the "live" version (preset + any override already saved).
  type FormShape = {
    eyebrow: string; title: string; titleAccent: string;
    subtitle: string; cta: string;
    color: string; orbA: string; orbB: string; bg: string;
    bgImage: string;          // empty string means "no image"
    bgOverlayColor: string;
    bgOverlayOpacity: number; // 0–1
  };

  const [form, setForm] = useState<FormShape>({
    eyebrow: resolved.eyebrow,
    title: resolved.title,
    titleAccent: resolved.titleAccent,
    subtitle: resolved.subtitle,
    cta: resolved.cta,
    color: resolved.color,
    orbA: resolved.orbA,
    orbB: resolved.orbB,
    bg: resolved.bg,
    bgImage: resolved.bgImage ?? '',
    bgOverlayColor: resolved.bgOverlayColor,
    bgOverlayOpacity: resolved.bgOverlayOpacity,
  });

  // Track whether the user has made unsaved edits — prevents Realtime
  // events from re-seeding the form and overwriting their work.
  const formDirtyRef = useRef(false);
  const [lastSeededKey, setLastSeededKey] = useState<OccasionKey | null>(null);

  // Re-seed when switching occasion in the editor, or on initial data load.
  useEffect(() => {
    if (!hydrated) return;
    if (editingKey !== lastSeededKey) {
      const r = getResolved(editingKey);
      setForm({
        eyebrow: r.eyebrow, title: r.title, titleAccent: r.titleAccent,
        subtitle: r.subtitle, cta: r.cta, color: r.color,
        orbA: r.orbA, orbB: r.orbB, bg: r.bg,
        bgImage: r.bgImage ?? '',
        bgOverlayColor: r.bgOverlayColor,
        bgOverlayOpacity: r.bgOverlayOpacity,
      });
      setLastSeededKey(editingKey);
      formDirtyRef.current = false;
    }
  }, [editingKey, hydrated, getResolved, lastSeededKey]);

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof FormShape>(k: K, v: FormShape[K]) => {
    formDirtyRef.current = true;
    setForm((p) => ({ ...p, [k]: v }));
  };

  const onPickBgImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadErr('الرجاء اختيار ملف صورة (PNG / JPG / WebP).');
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImageFile(file);
      setForm((p) => ({ ...p, bgImage: compressed.dataUrl }));
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'فشل قراءة الصورة.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeBgImage = () => update('bgImage', '');

  const onSave = useCallback(async () => {
    console.log('[HeroEditor] onSave FIRED (v2 — async+await)', { editingKey });
    setSaveError(null);
    setSaving(true);

    const patch: HeroOverride = {
      eyebrow: form.eyebrow,
      title: form.title,
      titleAccent: form.titleAccent,
      subtitle: form.subtitle,
      cta: form.cta,
      color: form.color,
      orbA: form.orbA,
      orbB: form.orbB,
      bg: form.bg,
      bgImage: form.bgImage || undefined,
      bgOverlayColor: form.bgOverlayColor,
      bgOverlayOpacity: form.bgOverlayOpacity,
    };

    const result = await setOverride(editingKey, patch);

    setSaving(false);

    if (result.ok) {
      formDirtyRef.current = false;          // allow re-seed with fresh DB data
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } else {
      setSaveError(result.error || 'فشل حفظ التغييرات في قاعدة البيانات');
    }
  }, [editingKey, form, setOverride]);

  const onReset = useCallback(async () => {
    if (!window.confirm('سيتم إرجاع الواجهة لإعداداتها الافتراضية (يشمل حذف الخلفية المرفوعة). متابعة؟')) return;
    const result = await resetOccasion(editingKey);
    if (!result.ok) {
      setSaveError(result.error || 'فشل حذف التخصيص من قاعدة البيانات');
      return;
    }
    formDirtyRef.current = false;
    const o = OCCASIONS.find((x) => x.key === editingKey)!;
    setForm({
      eyebrow: o.hero.eyebrow, title: o.hero.title, titleAccent: o.hero.titleAccent,
      subtitle: o.hero.subtitle, cta: o.hero.cta,
      color: o.color, orbA: o.orbColors[0], orbB: o.orbColors[1], bg: o.bg,
      bgImage: '', bgOverlayColor: '#FFFFFF', bgOverlayOpacity: 0.7,
    });
    setSaveError(null);
  }, [editingKey, resetOccasion]);

  const onSetAsActive = () => setActive(editingKey);

  return (
    <div className="card-surface p-5 sm:p-6 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="grid place-items-center w-11 h-11 rounded-2xl shrink-0"
            style={{ background: form.bg, color: form.color }}
          >
            <Paintbrush className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-extrabold text-ink-900 dark:text-ink-50">
              تعديل واجهة الصفحة الرئيسية
            </h3>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
              غيّر النصوص والألوان. التغييرات تنعكس مباشرة على الصفحة الرئيسية.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedAt && (
            <span className="text-xs font-bold text-green-600 dark:text-green-400">
              تم الحفظ ✓
            </span>
          )}
          <button onClick={onReset} className="btn-ghost text-sm" title="استعادة الإعداد الافتراضي" disabled={saving}>
            <RotateCcw className="h-4 w-4" />
            <span>إعادة تعيين</span>
          </button>
          <button onClick={onSave} className="btn-primary text-sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</span>
          </button>
        </div>
      </header>

      {/* Occasion picker — choose WHICH occasion to edit */}
      <div>
        <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-2">
          المناسبة التي تعدّلها
        </label>
        <div className="flex flex-wrap gap-1.5">
          {OCCASIONS.map((o) => {
            const active = o.key === editingKey;
            return (
              <button
                key={o.key}
                onClick={() => setEditingKey(o.key)}
                className="text-xs font-bold rounded-lg px-2.5 py-1.5 border-2 transition-all"
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
        {editingKey !== activeKey && (
          <button
            onClick={onSetAsActive}
            className="mt-2 text-xs text-brand-600 dark:text-brand-400 hover:underline"
          >
            ⓘ هذه المناسبة غير المفعّلة حالياً — اضغط هنا لجعلها الواجهة الفعلية
          </button>
        )}
      </div>

      {saveError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm space-y-1">
          <div className="font-bold flex items-center gap-2">
            <X className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>فشل حفظ التغييرات في قاعدة البيانات</span>
          </div>
          <p className="text-xs font-mono break-all bg-white dark:bg-ink-900 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
            {saveError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
        {/* LEFT — text fields */}
        <div className="space-y-3">
          <Field label="الشارة الصغيرة (فوق العنوان)" value={form.eyebrow} onChange={(v) => update('eyebrow', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="العنوان (الجزء العادي)" value={form.title} onChange={(v) => update('title', v)} />
            <Field label="العنوان (الجزء الملوّن)" value={form.titleAccent} onChange={(v) => update('titleAccent', v)} />
          </div>
          <Field label="الوصف" value={form.subtitle} onChange={(v) => update('subtitle', v)} multiline />
          <Field label="نص الزر" value={form.cta} onChange={(v) => update('cta', v)} />

          <div className="pt-2 border-t border-ink-200 dark:border-ink-700">
            <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-2">
              الألوان
            </label>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="اللون الرئيسي" value={form.color} onChange={(v) => update('color', v)} />
              <ColorField label="خلفية الشارة" value={form.bg} onChange={(v) => update('bg', v)} />
              <ColorField label="الكرة الزخرفية ١" value={form.orbA} onChange={(v) => update('orbA', v)} />
              <ColorField label="الكرة الزخرفية ٢" value={form.orbB} onChange={(v) => update('orbB', v)} />
            </div>
          </div>

          <div className="pt-2 border-t border-ink-200 dark:border-ink-700">
            <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-2">
              صورة خلفية الواجهة (اختياري)
            </label>

            {form.bgImage ? (
              <div className="space-y-3">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-ink-100 dark:bg-ink-900 border border-ink-200 dark:border-ink-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.bgImage}
                    alt="معاينة الخلفية"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: form.bgOverlayColor, opacity: form.bgOverlayOpacity }}
                  />
                  <button
                    onClick={removeBgImage}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    type="button"
                    title="حذف الخلفية"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ColorField
                    label="لون الطبقة"
                    value={form.bgOverlayColor}
                    onChange={(v) => update('bgOverlayColor', v)}
                  />
                  <div>
                    <label className="block text-[11px] font-bold text-ink-500 dark:text-ink-400 mb-1">
                      كثافة الطبقة ({Math.round(form.bgOverlayOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={form.bgOverlayOpacity}
                      onChange={(e) => update('bgOverlayOpacity', parseFloat(e.target.value))}
                      className="w-full accent-brand-500"
                    />
                    <div className="flex justify-between text-[10px] text-ink-400 mt-0.5">
                      <span>شفافة</span>
                      <span>كثيفة</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-ink-400">
                  ⓘ كثافة أعلى = الصورة باهتة أكثر والنص أوضح. كثافة أقل = الصورة أوضح.
                </p>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-ink-200 dark:border-ink-700 hover:border-brand-400 transition-colors p-5 text-center"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-ink-500">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                    <span className="text-xs">جارٍ معالجة الصورة…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-ink-500 dark:text-ink-400">
                    <Upload className="h-6 w-6 text-brand-500" />
                    <span className="text-xs font-bold text-ink-700 dark:text-ink-200">
                      ارفع صورة خلفية
                    </span>
                    <span className="text-[10px]">PNG · JPG · WebP (يتم الضغط تلقائياً)</span>
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPickBgImage}
              className="hidden"
            />
            {uploadErr && (
              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {uploadErr}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — live preview */}
        <div className="lg:sticky lg:top-4 h-fit">
          <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-2">
            معاينة مباشرة
          </label>
          <HeroPreview form={form} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-ink-500 dark:text-ink-400 mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-ink-800 border-2 border-ink-200 dark:border-ink-700 text-sm focus:border-brand-500 focus:outline-none transition-colors"
          dir="auto"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-ink-800 border-2 border-ink-200 dark:border-ink-700 text-sm focus:border-brand-500 focus:outline-none transition-colors"
          dir="auto"
        />
      )}
    </div>
  );
}

function ColorField({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-ink-500 dark:text-ink-400 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer border-2 border-ink-200 dark:border-ink-700 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg bg-white dark:bg-ink-800 border-2 border-ink-200 dark:border-ink-700 text-xs font-mono focus:border-brand-500 focus:outline-none"
          dir="ltr"
        />
      </div>
    </div>
  );
}

interface PreviewProps {
  form: {
    eyebrow: string; title: string; titleAccent: string;
    subtitle: string; cta: string;
    color: string; orbA: string; orbB: string; bg: string;
    bgImage: string; bgOverlayColor: string; bgOverlayOpacity: number;
  };
}

function HeroPreview({ form }: PreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 aspect-[4/3]">
      {form.bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: form.bgOverlayColor, opacity: form.bgOverlayOpacity }}
          />
        </>
      )}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: form.orbA + '66' }}
      />
      <div
        className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: form.orbB + '4D' }}
      />
      <div className="relative p-5 flex flex-col h-full justify-center">
        <div
          className="inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-3"
          style={{ background: form.bg, color: form.color }}
        >
          <Sparkles className="h-3 w-3" />
          <span>{form.eyebrow}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-ink-900 dark:text-ink-50">
          {form.title}{' '}
          <span style={{ color: form.color }}>{form.titleAccent}</span>
        </h1>
        <p className="mt-2 text-xs text-ink-600 dark:text-ink-300 leading-relaxed line-clamp-3">
          {form.subtitle}
        </p>
        <div className="mt-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
            style={{ background: form.color }}
          >
            <Sparkles className="h-3 w-3" />
            <span>{form.cta}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

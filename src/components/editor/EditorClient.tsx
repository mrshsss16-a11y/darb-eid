'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ArrowRight, Download, Share2, Loader2, QrCode, Image as ImageIcon } from 'lucide-react';
import { useTemplates, getSeedTemplate } from '@/templates/store';
import type { CanvasFormat, NameStyle } from '@/templates/types';
import { FORMAT_DIMENSIONS } from '@/templates/types';
import { TemplateCanvas } from '@/components/TemplateCanvas';
import { FormatSwitch } from '@/components/editor/FormatSwitch';
import { exportNodeAsImage, whatsappShareUrl, type ExportFormat } from '@/utils/exportImage';

interface Props {
  templateId: string;
}

/**
 * Editor — the main client experience.
 *  - Reads the template from the store
 *  - Lets the user type a name, pick a format, tune positioning
 *  - Renders the live preview at a scaled-down size while keeping the actual
 *    DOM at full resolution for export
 *  - Triggers PNG/JPG export via html-to-image
 *  - Shares to WhatsApp via a deep link
 *  - Optional QR overlay linking to the corporate site
 */
export function EditorClient({ templateId }: Props) {
  const { templates } = useTemplates();
  // Resolve the template synchronously: prefer the live store (covers admin
  // overrides + custom uploads) and fall back to the seed list so the page
  // renders immediately on first paint without a loading flicker.
  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? getSeedTemplate(templateId),
    [templates, templateId],
  );

  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CanvasFormat>('square');
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>();
  const [busy, setBusy] = useState<null | ExportFormat>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);



  // Build the QR (once / when toggled).
  useEffect(() => {
    if (!showQr) {
      setQrDataUrl(undefined);
      return;
    }
    const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.darbstations.com.sa';
    QRCode.toDataURL(url, {
      margin: 0,
      width: 256,
      color: { dark: '#0E0E10', light: '#FFFFFF' },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(undefined));
  }, [showQr]);

  // Responsive preview pixel width — tracked via ResizeObserver so the canvas
  // resizes correctly when the side panel mounts, the format changes, the
  // window resizes, or fonts load.
  const [previewWidth, setPreviewWidth] = useState(440);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) return;

    const recompute = () => {
      const dims = FORMAT_DIMENSIONS[format];
      const wRaw = wrap.clientWidth;
      const wPadded = wRaw > 50 ? wRaw - 40 : 400; // account for p-5
      const maxW = Math.min(wPadded, 560);
      const maxH = Math.min(window.innerHeight * 0.65, format === 'story' ? 720 : 560);
      // Constrain so height (= width * (dims.h/dims.w)) fits maxH.
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

  // Hidden full-res canvas — same content as the preview, but rendered at the
  // format's native pixel size. html-to-image captures THIS node for export
  // so the output is always sharp regardless of the preview size.
  const exportCanvasRef = useRef<HTMLDivElement | null>(null);

  const onExport = useCallback(
    async (fmt: ExportFormat) => {
      if (!name.trim()) {
        setTouched(true);
        return;
      }
      // Capture the HIDDEN full-resolution canvas (not the small preview one)
      // so the exported image is sharp regardless of the on-screen preview size.
      if (!exportCanvasRef.current) return;
      setBusy(fmt);
      try {
        const dims = FORMAT_DIMENSIONS[format];
        await exportNodeAsImage(exportCanvasRef.current, {
          format: fmt,
          filename: `darb-eid-${template?.id}-${Date.now()}.${fmt}`,
          width: dims.w,
          height: dims.h,
          pixelRatio: 2,
        });
      } finally {
        setBusy(null);
      }
    },
    [name, format, template?.id],
  );

  const onShare = useCallback(async () => {
    if (!name.trim()) {
      setTouched(true);
      return;
    }
    // Native share API first (mobile-friendly with image attachment)
    try {
      if (exportCanvasRef.current && navigator.canShare) {
        const dims = FORMAT_DIMENSIONS[format];
        const dataUrl = await exportNodeAsImage(exportCanvasRef.current, {
          format: 'png',
          filename: `darb-eid-${template?.id}.png`,
          width: dims.w,
          height: dims.h,
          pixelRatio: 2,
        });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `darb-eid.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'بطاقة معايدة درب',
            text: process.env.NEXT_PUBLIC_SHARE_TEXT ||
              'معايدة عيد الأضحى المبارك من فريق درب',
          });
          return;
        }
      }
    } catch {
      // fall through to wa.me link
    }
    const text = process.env.NEXT_PUBLIC_SHARE_TEXT ||
      'معايدة عيد الأضحى المبارك من فريق درب';
    window.open(whatsappShareUrl(text), '_blank', 'noopener,noreferrer');
    setShareMsg('تم فتح واتساب — أرفق البطاقة التي حمّلتها يدوياً');
    setTimeout(() => setShareMsg(null), 5000);
  }, [name, format, template?.id]);

  if (!template) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-ink-600 dark:text-ink-300">
          القالب المطلوب غير موجود.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          العودة للمعرض
        </Link>
      </div>
    );
  }

  const showError = touched && !name.trim();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 page-enter">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 dark:text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 mb-4 transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        <span>العودة للقوالب</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-10">
        {/* PREVIEW */}
        <div>
          <div className="card-surface p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-ink-50">
                  {template.title}
                </h1>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                  {template.occasion}
                </p>
              </div>
              <FormatSwitch value={format} onChange={setFormat} />
            </div>

            <div
              ref={previewWrapRef}
              className="bg-ink-100 dark:bg-ink-900 rounded-2xl p-3 sm:p-5 flex items-center justify-center min-h-[360px]"
            >
              <TemplateCanvas
                ref={canvasRef}
                template={template}
                employeeName={name}
                format={format}
                nameStyle={template.defaultNameStyle}
                qrDataUrl={qrDataUrl}
                pixelWidth={previewWidth}
              />
            </div>

            {/* Hidden full-resolution canvas used ONLY for export. Positioned
                off-screen so it doesn't disrupt layout but still renders. */}
            <div
              aria-hidden
              style={{
                position: 'fixed',
                left: -99999,
                top: 0,
                width: FORMAT_DIMENSIONS[format].w,
                height: FORMAT_DIMENSIONS[format].h,
                pointerEvents: 'none',
              }}
            >
              <TemplateCanvas
                ref={exportCanvasRef}
                template={template}
                employeeName={name}
                format={format}
                nameStyle={template.defaultNameStyle}
                qrDataUrl={qrDataUrl}
                // No pixelWidth → renders at native dims (1080×1080 etc.)
              />
            </div>

            {/* Action row */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onExport('png')}
                disabled={busy !== null}
                className="btn-primary"
              >
                {busy === 'png' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span>تحميل PNG</span>
              </button>
              <button
                onClick={() => onExport('jpg')}
                disabled={busy !== null}
                className="btn-ghost"
              >
                {busy === 'jpg' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
                <span>تحميل JPG</span>
              </button>
              <button onClick={onShare} className="btn-outline">
                <Share2 className="h-5 w-5" />
                <span>مشاركة على واتساب</span>
              </button>
            </div>

            {shareMsg && (
              <p className="mt-3 text-sm text-brand-600 dark:text-brand-400">
                {shareMsg}
              </p>
            )}
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-4">
          {/* Name */}
          <div className="card-surface p-5 sm:p-6">
            <label
              htmlFor="employee-name"
              className="block text-sm font-bold text-ink-700 dark:text-ink-200 mb-2"
            >
              اسم الموظف <span className="text-brand-500">*</span>
            </label>
            <input
              id="employee-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched) setTouched(false);
              }}
              onBlur={() => setTouched(true)}
              placeholder="مثال: عبدالله الحربي / Abdullah Al-Harbi"
              dir="auto"
              maxLength={60}
              className="input-field"
              aria-invalid={showError}
              aria-describedby={showError ? 'name-error' : undefined}
            />
            {showError ? (
              <p id="name-error" className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                الرجاء إدخال الاسم قبل تحميل البطاقة
              </p>
            ) : (
              <p className="mt-2 text-xs text-ink-400">
                يدعم الحقل العربية والإنجليزية — حتى 60 حرفاً، ويتم تصغير الخط تلقائياً للأسماء الطويلة.
              </p>
            )}
          </div>



          {/* QR toggle */}
          <div className="card-surface p-5 sm:p-6">
            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                  <QrCode className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-bold text-ink-800 dark:text-ink-100 text-sm">
                    إضافة رمز QR
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">
                    رابط حسابات درب الرسمية
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showQr}
                onChange={(e) => setShowQr(e.target.checked)}
                className="h-5 w-5 accent-brand-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

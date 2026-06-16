'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import type { Template, CanvasFormat, NameStyle } from '@/templates/types';
import { FORMAT_DIMENSIONS } from '@/templates/types';
import { fitTextToWidth } from '@/utils/autoFit';

interface TemplateCanvasProps {
  template: Template;
  employeeName: string;
  format: CanvasFormat;
  nameStyle: NameStyle;
  qrDataUrl?: string;
  /**
   * Visible preview width in CSS pixels. The canvas always renders at THIS
   * size — no transform:scale tricks. All inside-canvas measurements (font,
   * positions, QR) are computed proportionally so the look is identical at
   * any size, just smaller pixels.
   *
   * For export, use the `ref` to capture the node and pass `width/height`
   * options to html-to-image at the format's native dimensions.
   */
  pixelWidth?: number;
  className?: string;
}

/**
 * Renders the artwork + name + optional QR at an exact pixel size.
 *
 * Why no transform:scale? Earlier versions wrapped a 1080×1080 element in a
 * `transform: scale(s)` to display it smaller. That works for the SVG
 * background designs but, in some browser layouts, broke `<img>` rendering
 * for admin-uploaded data URLs — the image element was in the DOM but
 * invisible. Rendering at the target pixel size with proportional internals
 * eliminates the entire class of bug.
 */
export const TemplateCanvas = forwardRef<HTMLDivElement, TemplateCanvasProps>(
  function TemplateCanvas(
    { template, employeeName, format, nameStyle, qrDataUrl, pixelWidth, className = '' },
    ref,
  ) {
    const dims = FORMAT_DIMENSIONS[format];
    // Default to native dims when no preview size is supplied (e.g. when this
    // node is being captured for export).
    const cssW = pixelWidth ?? dims.w;
    const cssH = (cssW / dims.w) * dims.h;

    const customImgSrc = template.customImages?.[format] || template.customImage;
    const fitRef = useRef<HTMLSpanElement | null>(null);
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [customImgSrc]);

    // Auto-fit the name if it would overflow the chosen max width.
    useEffect(() => {
      const el = fitRef.current;
      if (!el) return;
      const maxPx = (nameStyle.maxWidthPct / 100) * cssW;
      fitTextToWidth(el, maxPx);
    }, [employeeName, nameStyle.maxWidthPct, nameStyle.fontSizePct, cssW]);

    const trimmed = employeeName.trim();
    const isPlaceholder = trimmed.length === 0;
    const displayName = isPlaceholder ? 'اسم الموظف' : trimmed;

    const translateX =
      nameStyle.align === 'center' ? '-50%' : nameStyle.align === 'right' ? '-100%' : '0%';

    // Internal coordinates are now in actual CSS pixels of the preview.
    const fontPx = (nameStyle.fontSizePct / 100) * cssW;
    const qrSizePx = cssW * 0.10;
    const qrInsetPx = cssW * 0.04;
    const qrRadius = cssW * 0.012;
    const qrPad = cssW * 0.008;
    const isPreview = pixelWidth !== undefined && pixelWidth < dims.w;

    return (
      <div
        ref={ref}
        className={`template-canvas ${className}`}
        style={{
          position: 'relative',
          width: cssW,
          height: cssH,
          background: template.palette.bg,
          overflow: 'hidden',
          isolation: 'isolate',
          // Subtle outline so a near-white canvas stays distinguishable from
          // a light-gray surrounding panel — never present at full resolution
          // (i.e. during export).
          boxShadow: isPreview
            ? '0 0 0 1px rgba(0,0,0,0.1), 0 12px 40px -12px rgba(14,14,16,0.18)'
            : undefined,
          borderRadius: isPreview ? 8 : undefined,
        }}
      >
        {/* Artwork layer */}
        {customImgSrc && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={customImgSrc}
            alt={template.title}
            onError={() => setImgError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              zIndex: 1,
            }}
          />
        ) : customImgSrc && imgError ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background:
                'repeating-linear-gradient(45deg,#FDE8D6 0 30px,#FFF4EC 30px 60px)',
              color: '#A93F09',
              fontSize: cssW * 0.04,
              fontWeight: 700,
              textAlign: 'center',
              padding: cssW * 0.04,
              fontFamily: "'Tajawal', sans-serif",
              zIndex: 1,
            }}
          >
            تعذّر تحميل صورة هذا القالب — احذفه من لوحة الإدارة وارفعه مرة أخرى.
          </div>
        ) : (
          // Built-in SVG artwork — its <svg width="100%" height="100%"> fills
          // whatever the parent is. With viewBox + preserveAspectRatio it
          // scales proportionally.
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            {template.renderArtwork({ format })}
          </div>
        )}

        {/* Name overlay */}
        <div
          style={{
            position: 'absolute',
            left: `${nameStyle.x}%`,
            top: `${nameStyle.y}%`,
            transform: `translate(${translateX}, -50%)`,
            maxWidth: `${nameStyle.maxWidthPct}%`,
            textAlign: nameStyle.align,
            pointerEvents: 'none',
            direction: 'rtl',
            zIndex: 2,
          }}
        >
          <span
            ref={fitRef}
            className="fit-text"
            style={{
              fontSize: `${fontPx}px`,
              color: nameStyle.color,
              fontWeight: nameStyle.weight ?? 700,
              fontFamily:
                "'DIN Next Arabic', 'DIN Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', sans-serif",
              lineHeight: 1.15,
              opacity: isPlaceholder ? 0.35 : 1,
              fontStyle: isPlaceholder ? 'italic' : 'normal',
              textShadow:
                !isPlaceholder && nameStyle.shadow
                  ? `0 ${cssW * 0.002}px ${cssW * 0.018}px rgba(0,0,0,0.45),
                     0 ${cssW * 0.001}px ${cssW * 0.003}px rgba(0,0,0,0.3)`
                  : 'none',
              transition: 'opacity 150ms ease-out',
            }}
          >
            {displayName}
          </span>
        </div>

        {/* QR overlay */}
        {qrDataUrl && (
          <div
            style={{
              position: 'absolute',
              bottom: qrInsetPx,
              left: qrInsetPx,
              width: qrSizePx,
              height: qrSizePx,
              background: 'rgba(255,255,255,0.92)',
              borderRadius: qrRadius,
              padding: qrPad,
              boxShadow: `0 ${cssW * 0.0074}px ${cssW * 0.028}px rgba(0,0,0,0.25)`,
              zIndex: 3,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
        )}
      </div>
    );
  },
);

'use client';

import { useEffect, useState } from 'react';

/**
 * Official Darb logo.
 *
 * The GIF logo is designed for dark backgrounds.
 *
 * Light mode → wraps the logo in a dark rounded pill so it reads clearly
 *              on white/light surfaces (correct UX: give it its native context).
 * Dark mode  → no wrapper, logo sits directly on the dark page background.
 */
interface DarbLogoProps {
  /** Height in pixels (of the logo image). The pill adds vertical padding. */
  height?: number;
  className?: string;
  /** Force the inline SVG fallback even if a /public/darb-logo file exists. */
  forceInline?: boolean;
}

const ASPECT = 920 / 320;

export function DarbLogo({ height = 36, className = '', forceInline = false }: DarbLogoProps) {
  const [hasAsset, setHasAsset] = useState<null | string>(null);
  const [isDark, setIsDark] = useState(false);

  // Watch the `dark` class on <html> — fires instantly on theme toggle.
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Probe for the asset file.
  useEffect(() => {
    if (forceInline) return;
    let cancelled = false;
    (async () => {
      for (const url of ['/darb-logo.svg', '/darb-logo.png', '/darb-logo.gif']) {
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (!cancelled && res.ok) {
            setHasAsset(url);
            return;
          }
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forceInline]);

  if (hasAsset) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={hasAsset}
        alt="Darb"
        style={{ height, width: 'auto', display: 'block' }}
        className={className}
      />
    );
  }

  // ── Inline SVG fallback ──────────────────────────────────────────────────
  return (
    <svg
      width={height * ASPECT}
      height={height}
      viewBox="0 0 920 320"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Darb"
    >
      {/* Orange capsule border */}
      <rect x="0" y="0" width="920" height="320" rx="160" fill="#F26B1F" />
      {/* Inner gray fill */}
      <rect x="22" y="22" width="876" height="276" rx="138" fill="#86868F" />

      {/* "درب" — Arabic */}
      <text
        x="460"
        y="145"
        textAnchor="middle"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', sans-serif"
        fontSize="120"
        fontWeight="700"
        fill="#FFFFFF"
        dominantBaseline="middle"
      >
        درب
      </text>
      {/* "Darb" — Latin */}
      <text
        x="460"
        y="240"
        textAnchor="middle"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', sans-serif"
        fontSize="90"
        fontWeight="700"
        fill="#FFFFFF"
        letterSpacing="3"
        dominantBaseline="middle"
      >
        Darb
      </text>
    </svg>
  );
}

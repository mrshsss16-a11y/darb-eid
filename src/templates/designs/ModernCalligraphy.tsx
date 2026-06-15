import type { ArtworkRenderer } from '../types';

/**
 * Modern Calligraphy — bold typographic statement piece. Single large
 * "عيد مبارك" mark on a clean ink background with a single orange accent line.
 */
export const ModernCalligraphy: ArtworkRenderer = ({ format }) => {
  const isStory = format === 'story';
  const isPost = format === 'post';
  const w = isPost ? 1200 : 1080;
  const h = isStory ? 1920 : isPost ? 630 : 1080;

  return (
    <svg
      width="100%" height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0E0E10" />
          <stop offset="100%" stopColor="#1A1A1D" />
        </linearGradient>
        <linearGradient id="mc-accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F26B1F" />
          <stop offset="100%" stopColor="#FF9B5E" />
        </linearGradient>
      </defs>

      <rect width={w} height={h} fill="url(#mc-bg)" />

      {/* Big background watermark — softer */}
      <text
        x={w / 2}
        y={h * 0.55}
        textAnchor="middle"
        fontSize={isPost ? 320 : 580}
        fontWeight="900"
        fill="#F26B1F"
        opacity="0.08"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', serif"
        letterSpacing="-20"
      >
        عيد
      </text>

      {/* Top-right floating circle */}
      <circle cx={w - 100} cy="100" r="60" fill="none" stroke="#F26B1F" strokeWidth="1.5" opacity="0.4" />
      <circle cx={w - 100} cy="100" r="30" fill="#F26B1F" opacity="0.5" />

      {/* Bottom-left dot grid */}
      <g transform={`translate(60 ${h - 200})`}>
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle
              key={`${r}-${c}`}
              cx={c * 18}
              cy={r * 18}
              r="2"
              fill="#F26B1F"
              opacity={0.15 + (r + c) * 0.04}
            />
          ))
        )}
      </g>

      {/* Main statement — top half */}
      <g transform={`translate(${w / 2} ${h * (isStory ? 0.32 : 0.36)})`}>
        <text
          textAnchor="middle"
          fontSize={isPost ? 90 : 160}
          fontWeight="900"
          fill="#FFF8F0"
          fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
          letterSpacing="-3"
        >
          عيد مبارك
        </text>
        {/* Accent underline */}
        <rect
          x={isPost ? -80 : -120}
          y={isPost ? 30 : 50}
          width={isPost ? 160 : 240}
          height={isPost ? 6 : 10}
          rx="3"
          fill="url(#mc-accent)"
        />
      </g>

      {/* English sub */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.41 : 0.50)}
        textAnchor="middle"
        fontSize={isPost ? 18 : 28}
        fontWeight="500"
        fill="#B9B9C0"
        letterSpacing="6"
      >
        EID AL-ADHA · {new Date().getFullYear()}
      </text>

      {/* Bottom-right brand */}
      <g transform={`translate(${w - 80} ${h - 60})`}>
        <text
          textAnchor="end"
          fontSize={isPost ? 18 : 26}
          fontWeight="900"
          fill="#F26B1F"
          letterSpacing="4"
        >
          DARB
        </text>
        <text
          textAnchor="end"
          y="-22"
          fontSize={isPost ? 12 : 16}
          fill="#86868F"
          letterSpacing="3"
        >
          من فريق
        </text>
      </g>
    </svg>
  );
};

import type { ArtworkRenderer } from '../types';

/**
 * Geometric Pattern — full-bleed traditional 8-fold Islamic star tessellation
 * with a clear central cartouche reserved for greeting + name.
 */
export const GeometricPattern: ArtworkRenderer = ({ format }) => {
  const isStory = format === 'story';
  const isPost = format === 'post';
  const w = isPost ? 1200 : 1080;
  const h = isStory ? 1920 : isPost ? 630 : 1080;

  // Build a star unit ~120px wide that tiles via pattern.
  return (
    <svg
      width="100%" height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="gp-star" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
          {/* 8-point star */}
          <g transform="translate(80 80)">
            <path
              d="M0 -55 L13 -22 L48 -25 L23 -1 L48 23 L13 20 L0 55 L-13 20 L-48 23 L-23 -1 L-48 -25 L-13 -22 Z"
              fill="#F26B1F" opacity="0.15"
            />
            <path
              d="M0 -55 L13 -22 L48 -25 L23 -1 L48 23 L13 20 L0 55 L-13 20 L-48 23 L-23 -1 L-48 -25 L-13 -22 Z"
              fill="none" stroke="#A93F09" strokeWidth="1.5" opacity="0.35"
            />
            <circle r="6" fill="#A93F09" />
          </g>
          {/* Connecting lines between stars (cross pattern) */}
          <line x1="80" y1="0" x2="80" y2="160" stroke="#D8540F" strokeWidth="0.8" opacity="0.2" />
          <line x1="0" y1="80" x2="160" y2="80" stroke="#D8540F" strokeWidth="0.8" opacity="0.2" />
        </pattern>

        <linearGradient id="gp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8F0" />
          <stop offset="100%" stopColor="#FFE3D0" />
        </linearGradient>

        <radialGradient id="gp-cartouche" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#FFF8F0" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFF8F0" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={w} height={h} fill="url(#gp-bg)" />
      <rect width={w} height={h} fill="url(#gp-star)" />

      {/* Central cartouche — softens pattern behind text */}
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={isPost ? w * 0.4 : w * 0.42}
        ry={isStory ? h * 0.28 : h * 0.36}
        fill="url(#gp-cartouche)"
      />

      {/* Decorative ring around cartouche */}
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={isPost ? w * 0.36 : w * 0.38}
        ry={isStory ? h * 0.24 : h * 0.32}
        fill="none"
        stroke="#A93F09"
        strokeWidth="2"
        strokeDasharray="6 8"
        opacity="0.6"
      />
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={isPost ? w * 0.34 : w * 0.36}
        ry={isStory ? h * 0.225 : h * 0.30}
        fill="none"
        stroke="#F26B1F"
        strokeWidth="1"
        opacity="0.7"
      />

      {/* Top ornamental crown */}
      <g transform={`translate(${w / 2} ${h * (isStory ? 0.32 : 0.30)})`}>
        <path
          d="M -60 0 Q -30 -30 0 0 Q 30 -30 60 0"
          fill="none" stroke="#A93F09" strokeWidth="2" opacity="0.6"
        />
        <circle r="5" fill="#F26B1F" />
        <circle r="14" fill="none" stroke="#F26B1F" strokeWidth="1" />
      </g>

      {/* Greeting */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.42 : 0.43)}
        textAnchor="middle"
        fontSize={isPost ? 56 : 96}
        fontWeight="900"
        fill="#4F1B02"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-1"
      >
        عيد مبارك
      </text>
      <text
        x={w / 2}
        y={h * (isStory ? 0.46 : 0.50)}
        textAnchor="middle"
        fontSize={isPost ? 22 : 34}
        fontWeight="500"
        fill="#7C2D05"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
      >
        أعاده الله علينا بالخير واليُمن والبركات
      </text>

      {/* Bottom signature */}
      <text
        x={w / 2}
        y={h - 60}
        textAnchor="middle"
        fontSize={isPost ? 16 : 24}
        fontWeight="900"
        fill="#A93F09"
        letterSpacing="8"
      >
        DARB · درب
      </text>
    </svg>
  );
};

import type { ArtworkRenderer } from '../types';

/**
 * National Day — Saudi flag green dominant, with desert silhouette,
 * palms, and "هي لنا دار" greeting. Suitable for September 23 and
 * Founding Day.
 */
export const NationalDay: ArtworkRenderer = ({ format }) => {
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
        <linearGradient id="nd-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#0A6A3A" />
          <stop offset="60%" stopColor="#005430" />
          <stop offset="100%" stopColor="#003520" />
        </linearGradient>
        <radialGradient id="nd-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1A8A50" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#005430" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nd-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE3D0" />
          <stop offset="100%" stopColor="#F26B1F" />
        </linearGradient>
      </defs>

      {/* Green background */}
      <rect width={w} height={h} fill="url(#nd-bg)" />
      <ellipse cx={w / 2} cy={h * 0.4} rx={w * 0.6} ry={h * 0.4} fill="url(#nd-glow)" />

      {/* Diagonal sash — flag-inspired */}
      <g opacity="0.15">
        <path d={`M 0 ${h * 0.1} L ${w} 0 L ${w} ${h * 0.06} L 0 ${h * 0.16} Z`} fill="#FFFFFF" />
        <path d={`M 0 ${h - h * 0.1} L ${w} ${h - h * 0.16} L ${w} ${h - h * 0.06} L 0 ${h} Z`} fill="#FFFFFF" />
      </g>

      {/* Desert horizon */}
      <path
        d={`M 0 ${h * 0.78} Q ${w * 0.3} ${h * 0.72} ${w * 0.55} ${h * 0.8} Q ${w * 0.8} ${h * 0.88} ${w} ${h * 0.8} L ${w} ${h} L 0 ${h} Z`}
        fill="#003520"
        opacity="0.7"
      />

      {/* Palm trees silhouette */}
      {[
        { x: w * 0.12, scale: isPost ? 0.55 : 0.85 },
        { x: w * 0.88, scale: isPost ? 0.50 : 0.75 },
        { x: w * 0.25, scale: isPost ? 0.40 : 0.60 },
        { x: w * 0.75, scale: isPost ? 0.40 : 0.60 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${h * 0.79}) scale(${p.scale})`}>
          <rect x="-4" y="-90" width="8" height="90" fill="#001A0F" />
          {[-70, -40, -10, 20, 50, 80].map((a) => (
            <path
              key={a}
              d={`M 0 -85 Q ${Math.cos((a * Math.PI) / 180) * 35} ${-85 + Math.sin((a * Math.PI) / 180) * 30 - 12} ${Math.cos((a * Math.PI) / 180) * 65} ${-85 + Math.sin((a * Math.PI) / 180) * 55 - 4}`}
              stroke="#001A0F"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}

      {/* Crossed swords (Saudi flag style — simplified) */}
      <g transform={`translate(${w / 2} ${h * (isStory ? 0.78 : 0.84)})`} opacity="0.7">
        <path d="M -120 0 L 120 0" stroke="#FFE3D0" strokeWidth="3" />
        <path d="M -110 -8 L -110 8" stroke="#FFE3D0" strokeWidth="3" />
        <path d="M 110 -8 L 110 8" stroke="#FFE3D0" strokeWidth="3" />
      </g>

      {/* Star (palm-tree-and-swords decoration replaced with simple star) */}
      <g transform={`translate(${w / 2} ${h * (isStory ? 0.16 : 0.16)})`}>
        <path
          d="M 0 -42 L 12 -14 L 42 -14 L 18 8 L 28 36 L 0 20 L -28 36 L -18 8 L -42 -14 L -12 -14 Z"
          fill="url(#nd-gold)"
        />
      </g>

      {/* Main greeting */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.27 : 0.30)}
        textAnchor="middle"
        fontSize={isPost ? 70 : 130}
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-2"
      >
        دام عزك يا وطن
      </text>
      <text
        x={w / 2}
        y={h * (isStory ? 0.32 : 0.39)}
        textAnchor="middle"
        fontSize={isPost ? 26 : 40}
        fontWeight="500"
        fill="#FFE3D0"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
        letterSpacing="3"
      >
        المملكة العربية السعودية
      </text>

      {/* Bottom brand */}
      <text
        x={w / 2}
        y={h - 40}
        textAnchor="middle"
        fontSize={isPost ? 14 : 22}
        fontWeight="900"
        fill="#FFE3D0"
        letterSpacing="8"
      >
        DARB · درب
      </text>
    </svg>
  );
};

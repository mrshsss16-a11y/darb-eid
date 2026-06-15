import type { ArtworkRenderer } from '../types';

/**
 * Golden Mosque — silhouette of a mosque with dome + minarets against a
 * sunset-style gradient. Warm, ceremonial, statement piece.
 */
export const GoldenMosque: ArtworkRenderer = ({ format }) => {
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
        <linearGradient id="gm-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#1A1A1D" />
          <stop offset="55%" stopColor="#4F1B02" />
          <stop offset="85%" stopColor="#D8540F" />
          <stop offset="100%" stopColor="#F26B1F" />
        </linearGradient>
        <radialGradient id="gm-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE3D0" />
          <stop offset="80%" stopColor="#F26B1F" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F26B1F" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky gradient backdrop */}
      <rect width={w} height={h} fill="url(#gm-sky)" />

      {/* Distant sun glow */}
      <circle
        cx={w / 2}
        cy={h * 0.52}
        r={Math.min(w, h) * 0.35}
        fill="url(#gm-sun)"
      />

      {/* Subtle stars */}
      {Array.from({ length: 30 }).map((_, i) => {
        const cx = (i * 137) % w;
        const cy = ((i * 71) % (h * 0.4));
        const r = (i % 3) * 0.6 + 0.6;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity={0.3 + (i % 5) * 0.1} />
        );
      })}

      {/* Mosque silhouette band */}
      <g transform={`translate(0 ${h * 0.55})`}>
        {/* Ground */}
        <rect x="0" y={h * 0.2} width={w} height={h * 0.3} fill="#0E0E10" />

        {/* Central dome */}
        <g transform={`translate(${w / 2} 0)`}>
          {/* Minarets */}
          <rect x="-340" y="-60" width="14" height="220" fill="#0E0E10" />
          <polygon points="-347,-60 -319,-60 -333,-95" fill="#0E0E10" />
          <circle cx="-333" cy="-105" r="6" fill="#0E0E10" />

          <rect x="326" y="-60" width="14" height="220" fill="#0E0E10" />
          <polygon points="319,-60 347,-60 333,-95" fill="#0E0E10" />
          <circle cx="333" cy="-105" r="6" fill="#0E0E10" />

          {/* Main body */}
          <rect x="-200" y="0" width="400" height="160" fill="#0E0E10" />
          {/* Side wings */}
          <rect x="-280" y="40" width="80" height="120" fill="#0E0E10" />
          <rect x="200" y="40" width="80" height="120" fill="#0E0E10" />

          {/* Dome */}
          <path
            d="M -180 0 Q -180 -160 0 -180 Q 180 -160 180 0 Z"
            fill="#0E0E10"
          />
          {/* Spire */}
          <rect x="-3" y="-220" width="6" height="40" fill="#0E0E10" />
          <circle cx="0" cy="-225" r="8" fill="#0E0E10" />
          <path d="M 0 -245 L 3 -235 L 0 -240 L -3 -235 Z" fill="#0E0E10" />

          {/* Arched windows (cut-outs lit warm) */}
          <path d="M -40 60 Q -40 30 -20 30 Q 0 30 0 60 V 110 H -40 Z" fill="#F26B1F" opacity="0.85" />
          <path d="M  0 60 Q  0 30 20 30 Q 40 30 40 60 V 110 H  0 Z" fill="#F26B1F" opacity="0.85" />
          <circle cx="-120" cy="80" r="20" fill="#F26B1F" opacity="0.7" />
          <circle cx="120"  cy="80" r="20" fill="#F26B1F" opacity="0.7" />
        </g>
      </g>

      {/* Top greeting text */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.15 : 0.18)}
        textAnchor="middle"
        fontSize={isPost ? 60 : 110}
        fontWeight="900"
        fill="#FFF8F0"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-1"
      >
        عيد الأضحى المبارك
      </text>
      <text
        x={w / 2}
        y={h * (isStory ? 0.195 : 0.255)}
        textAnchor="middle"
        fontSize={isPost ? 22 : 32}
        fontWeight="400"
        fill="#FFE3D0"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
        letterSpacing="3"
      >
        تقبل الله منا ومنكم صالح الأعمال
      </text>

      {/* Bottom signature */}
      <text
        x={w / 2}
        y={h - 50}
        textAnchor="middle"
        fontSize={isPost ? 16 : 22}
        fontWeight="900"
        fill="#FFE3D0"
        letterSpacing="8"
      >
        DARB
      </text>
    </svg>
  );
};

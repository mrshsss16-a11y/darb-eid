import type { ArtworkRenderer } from '../types';

/**
 * Ramadan Crescent — deep navy night with a glowing crescent and twinkling stars.
 * The mood is reverent and intimate, suited for "رمضان كريم".
 */
export const RamadanCrescent: ArtworkRenderer = ({ format }) => {
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
        <radialGradient id="rc-sky" cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#1F2A4A" />
          <stop offset="60%" stopColor="#0E1530" />
          <stop offset="100%" stopColor="#070B1A" />
        </radialGradient>
        <radialGradient id="rc-moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8F0" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#FFE3D0" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFE3D0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rc-moon" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF8F0" />
          <stop offset="100%" stopColor="#FFE3D0" />
        </linearGradient>
      </defs>

      <rect width={w} height={h} fill="url(#rc-sky)" />

      {/* Twinkling stars */}
      {Array.from({ length: 80 }).map((_, i) => {
        const cx = (i * 173) % w;
        const cy = (i * 251) % (h * 0.85);
        const r = (i % 4) * 0.7 + 0.6;
        const opacity = 0.3 + (i % 7) * 0.1;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="#FFF8F0" opacity={opacity} />;
      })}

      {/* Big diamond stars */}
      {[
        { x: w * 0.18, y: h * 0.22, s: 6 },
        { x: w * 0.78, y: h * 0.18, s: 8 },
        { x: w * 0.86, y: h * 0.42, s: 5 },
        { x: w * 0.14, y: h * 0.5, s: 7 },
      ].map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y})`}>
          <path
            d={`M 0 -${s.s * 2} L ${s.s * 0.6} -${s.s * 0.6} L ${s.s * 2} 0 L ${s.s * 0.6} ${s.s * 0.6} L 0 ${s.s * 2} L -${s.s * 0.6} ${s.s * 0.6} L -${s.s * 2} 0 L -${s.s * 0.6} -${s.s * 0.6} Z`}
            fill="#FFE3D0"
            opacity="0.85"
          />
        </g>
      ))}

      {/* Crescent moon */}
      <g transform={`translate(${w * 0.5} ${h * (isStory ? 0.32 : 0.35)})`}>
        <circle r={isPost ? 160 : 240} fill="url(#rc-moonGlow)" />
        <circle r={isPost ? 80 : 130} fill="url(#rc-moon)" />
        <circle
          cx={isPost ? 28 : 45}
          cy={isPost ? -10 : -16}
          r={isPost ? 80 : 130}
          fill="url(#rc-sky)"
        />
      </g>

      {/* Mosque silhouette on the bottom */}
      <g transform={`translate(${w / 2} ${h - (isPost ? 100 : 220)})`}>
        {/* Domes & minarets */}
        <rect x="-260" y="-30" width="8" height="100" fill="#070B1A" />
        <polygon points="-264,-30 -248,-30 -256,-50" fill="#070B1A" />
        <circle cx="-256" cy="-56" r="4" fill="#070B1A" />

        <rect x="252" y="-30" width="8" height="100" fill="#070B1A" />
        <polygon points="248,-30 264,-30 256,-50" fill="#070B1A" />
        <circle cx="256" cy="-56" r="4" fill="#070B1A" />

        <path d="M -130 0 Q -130 -90 0 -110 Q 130 -90 130 0 Z" fill="#070B1A" />
        <rect x="-130" y="0" width="260" height="70" fill="#070B1A" />
        <rect x="-200" y="20" width="70" height="50" fill="#070B1A" />
        <rect x="130" y="20" width="70" height="50" fill="#070B1A" />

        <rect x="-3" y="-130" width="6" height="20" fill="#070B1A" />
        <circle cx="0" cy="-135" r="5" fill="#070B1A" />

        {/* Warm-lit windows */}
        <rect x="-20" y="20" width="14" height="30" rx="6" fill="#F26B1F" opacity="0.85" />
        <rect x="6" y="20" width="14" height="30" rx="6" fill="#F26B1F" opacity="0.85" />
      </g>

      {/* Greeting */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.56 : 0.66)}
        textAnchor="middle"
        fontSize={isPost ? 70 : 130}
        fontWeight="900"
        fill="#FFF8F0"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-2"
      >
        رمضان كريم
      </text>
      <text
        x={w / 2}
        y={h * (isStory ? 0.59 : 0.72)}
        textAnchor="middle"
        fontSize={isPost ? 22 : 34}
        fontWeight="500"
        fill="#FFE3D0"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
        letterSpacing="2"
      >
        كل عام وأنتم إلى الله أقرب
      </text>

      {/* Brand */}
      <text
        x={w / 2}
        y={h - 30}
        textAnchor="middle"
        fontSize={isPost ? 14 : 20}
        fontWeight="900"
        fill="#FFA068"
        letterSpacing="8"
      >
        DARB · درب
      </text>
    </svg>
  );
};

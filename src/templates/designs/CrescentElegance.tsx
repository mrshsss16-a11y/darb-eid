import type { ArtworkRenderer } from '../types';

/**
 * Crescent Elegance — minimal cream background, large crescent moon,
 * geometric border, gold-on-cream colour story. Calm and premium.
 */
export const CrescentElegance: ArtworkRenderer = ({ format }) => {
  const isStory = format === 'story';
  const isPost = format === 'post';
  const w = isPost ? 1200 : 1080;
  const h = isStory ? 1920 : isPost ? 630 : 1080;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="ce-bg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#FFF8F0" />
          <stop offset="100%" stopColor="#F5E6D3" />
        </radialGradient>
        <linearGradient id="ce-moon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F26B1F" />
          <stop offset="100%" stopColor="#A93F09" />
        </linearGradient>
        <pattern id="ce-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#D8540F" opacity="0.15" />
        </pattern>
      </defs>

      <rect width={w} height={h} fill="url(#ce-bg)" />
      <rect width={w} height={h} fill="url(#ce-dots)" />

      {/* Decorative geometric border */}
      <rect
        x="40" y="40" width={w - 80} height={h - 80}
        fill="none" stroke="#D8540F" strokeWidth="2" opacity="0.4"
        rx="20"
      />
      <rect
        x="60" y="60" width={w - 120} height={h - 120}
        fill="none" stroke="#F26B1F" strokeWidth="1" opacity="0.3"
        rx="14"
      />

      {/* Corner ornaments */}
      {[
        [80, 80, 0], [w - 80, 80, 90],
        [w - 80, h - 80, 180], [80, h - 80, 270],
      ].map(([cx, cy, rot], i) => (
        <g key={i} transform={`translate(${cx} ${cy}) rotate(${rot})`}>
          <path d="M0 0 L40 0 M0 0 L0 40 M0 0 L25 25"
                stroke="#A93F09" strokeWidth="2" opacity="0.5" />
          <circle r="4" fill="#F26B1F" />
        </g>
      ))}

      {/* Crescent moon — main motif, top-center */}
      <g transform={`translate(${w / 2} ${h * (isStory ? 0.28 : 0.32)})`}>
        <circle r={isPost ? 80 : 140} fill="url(#ce-moon)" />
        <circle
          r={isPost ? 80 : 140}
          cx={isPost ? 28 : 50}
          cy={isPost ? -10 : -18}
          fill="url(#ce-bg)"
        />
        {/* Tiny star */}
        <circle
          cx={isPost ? 120 : 200}
          cy={isPost ? 30 : 60}
          r={isPost ? 6 : 10}
          fill="#F26B1F"
        />
        <circle
          cx={isPost ? -110 : -180}
          cy={isPost ? -20 : -40}
          r={isPost ? 4 : 7}
          fill="#A93F09"
        />
      </g>

      {/* Greeting text — Arabic calligraphy */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.5 : 0.58)}
        textAnchor="middle"
        fontSize={isPost ? 56 : 100}
        fontWeight="900"
        fill="#0E0E10"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-1"
      >
        عيد أضحى مبارك
      </text>

      <text
        x={w / 2}
        y={h * (isStory ? 0.555 : 0.65)}
        textAnchor="middle"
        fontSize={isPost ? 22 : 32}
        fontWeight="500"
        fill="#5B5B63"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
      >
        كل عام وأنتم بخير
      </text>

      {/* Bottom signature — leaves space for name overlay above */}
      <text
        x={w / 2}
        y={h - 60}
        textAnchor="middle"
        fontSize={isPost ? 16 : 22}
        fontWeight="700"
        fill="#A93F09"
        letterSpacing="6"
      >
        DARB · درب
      </text>
    </svg>
  );
};

import type { ArtworkRenderer } from '../types';

/**
 * Desert Sunset — layered sand dunes with a glowing sun, palm silhouettes,
 * and warm gradient sky. Saudi-landscape inspired.
 */
export const DesertSunset: ArtworkRenderer = ({ format }) => {
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
        <linearGradient id="ds-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#FFE3D0" />
          <stop offset="50%" stopColor="#FFA068" />
          <stop offset="100%" stopColor="#F26B1F" />
        </linearGradient>
        <radialGradient id="ds-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#FFF8F0" />
          <stop offset="60%" stopColor="#FFE3D0" />
          <stop offset="100%" stopColor="#FFE3D0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ds-dune1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A93F09" />
          <stop offset="100%" stopColor="#7C2D05" />
        </linearGradient>
        <linearGradient id="ds-dune2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4F1B02" />
          <stop offset="100%" stopColor="#1A1A1D" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width={w} height={h} fill="url(#ds-sky)" />

      {/* Sun */}
      <circle cx={w / 2} cy={h * 0.42} r={Math.min(w, h) * 0.32} fill="url(#ds-sun)" />
      <circle cx={w / 2} cy={h * 0.42} r={Math.min(w, h) * 0.13} fill="#FFF8F0" />

      {/* Distant horizon line */}
      <line x1="0" y1={h * 0.58} x2={w} y2={h * 0.58} stroke="#F26B1F" strokeWidth="1" opacity="0.4" />

      {/* Back dune */}
      <path
        d={`M 0 ${h * 0.62}
           Q ${w * 0.25} ${h * 0.55} ${w * 0.5} ${h * 0.63}
           Q ${w * 0.75} ${h * 0.72} ${w} ${h * 0.6}
           L ${w} ${h} L 0 ${h} Z`}
        fill="url(#ds-dune1)"
      />

      {/* Front dune */}
      <path
        d={`M 0 ${h * 0.78}
           Q ${w * 0.3} ${h * 0.7} ${w * 0.55} ${h * 0.8}
           Q ${w * 0.8} ${h * 0.9} ${w} ${h * 0.82}
           L ${w} ${h} L 0 ${h} Z`}
        fill="url(#ds-dune2)"
      />

      {/* Palm trees on horizon */}
      {[
        { x: w * 0.12, scale: isPost ? 0.7 : 1 },
        { x: w * 0.88, scale: isPost ? 0.55 : 0.8 },
        { x: w * 0.22, scale: isPost ? 0.45 : 0.65 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${h * 0.62}) scale(${p.scale})`}>
          {/* trunk */}
          <path d="M -3 0 Q 0 -80 3 0 Z" fill="#0E0E10" />
          <path d="M -3 0 L 3 0 L 4 -80 L -4 -80 Z" fill="#0E0E10" />
          {/* fronds */}
          {[-60, -30, 0, 30, 60, 90, -90].map((a, j) => (
            <path
              key={j}
              d={`M 0 -75 Q ${Math.cos((a * Math.PI) / 180) * 40} ${-75 + Math.sin((a * Math.PI) / 180) * 40 - 10} ${Math.cos((a * Math.PI) / 180) * 60} ${-75 + Math.sin((a * Math.PI) / 180) * 60 - 5}`}
              stroke="#0E0E10"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}

      {/* Greeting */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.15 : 0.16)}
        textAnchor="middle"
        fontSize={isPost ? 56 : 100}
        fontWeight="900"
        fill="#4F1B02"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-1"
      >
        عيد أضحى مبارك
      </text>
      <text
        x={w / 2}
        y={h * (isStory ? 0.18 : 0.215)}
        textAnchor="middle"
        fontSize={isPost ? 20 : 30}
        fontWeight="500"
        fill="#7C2D05"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
      >
        من قلب الجزيرة العربية
      </text>

      {/* Bottom signature */}
      <text
        x={w / 2}
        y={h - 40}
        textAnchor="middle"
        fontSize={isPost ? 16 : 22}
        fontWeight="900"
        fill="#FFE3D0"
        letterSpacing="6"
      >
        DARB
      </text>
    </svg>
  );
};

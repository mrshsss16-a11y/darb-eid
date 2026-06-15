import type { ArtworkRenderer } from '../types';

/**
 * Lantern Glow — ornate Arabic lantern (فانوس) emitting warm light against
 * a deep navy backdrop with bokeh particles.
 */
export const LanternGlow: ArtworkRenderer = ({ format }) => {
  const isStory = format === 'story';
  const isPost = format === 'post';
  const w = isPost ? 1200 : 1080;
  const h = isStory ? 1920 : isPost ? 630 : 1080;

  const lanternCx = w / 2;
  const lanternCy = h * (isStory ? 0.4 : 0.42);
  const lanternScale = isPost ? 0.5 : isStory ? 1.05 : 1;

  return (
    <svg
      width="100%" height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="lg-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%"  stopColor="#2C2C30" />
          <stop offset="100%" stopColor="#0E0E10" />
        </radialGradient>
        <radialGradient id="lg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#FFE3D0" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#F26B1F" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F26B1F" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lg-lantern" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#FF9B5E" />
          <stop offset="100%" stopColor="#A93F09" />
        </linearGradient>
      </defs>

      {/* Backdrop */}
      <rect width={w} height={h} fill="url(#lg-bg)" />

      {/* Bokeh particles */}
      {Array.from({ length: 45 }).map((_, i) => {
        const cx = (i * 211) % w;
        const cy = (i * 137) % h;
        const r = (i % 5) * 1.5 + 2;
        const opacity = 0.05 + (i % 7) * 0.04;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="#F26B1F" opacity={opacity} />;
      })}

      {/* Lantern halo */}
      <circle
        cx={lanternCx}
        cy={lanternCy}
        r={250 * lanternScale}
        fill="url(#lg-glow)"
      />

      {/* Lantern */}
      <g transform={`translate(${lanternCx} ${lanternCy}) scale(${lanternScale})`}>
        {/* Chain */}
        <line x1="0" y1="-200" x2="0" y2="-130" stroke="#86868F" strokeWidth="2" />
        {/* Top cap */}
        <path d="M -30 -130 L 30 -130 L 25 -120 L -25 -120 Z" fill="#86868F" />
        <rect x="-35" y="-120" width="70" height="10" rx="3" fill="#5B5B63" />
        {/* Top dome */}
        <path d="M -50 -110 Q 0 -160 50 -110 Z" fill="#5B5B63" />
        <path d="M -55 -105 L 55 -105 L 50 -110 L -50 -110 Z" fill="#3F3F45" />
        {/* Body — glowing */}
        <path
          d="M -70 -100
             Q -90 -50 -80 0
             Q -90 50 -70 100
             L 70 100
             Q 90 50 80 0
             Q 90 -50 70 -100 Z"
          fill="url(#lg-lantern)"
        />
        {/* Inner light core */}
        <ellipse cx="0" cy="0" rx="40" ry="60" fill="#FFF8F0" opacity="0.9" />
        {/* Vertical ribs */}
        {[-50, -25, 0, 25, 50].map((x) => (
          <line key={x} x1={x} y1="-90" x2={x} y2="90" stroke="#4F1B02" strokeWidth="2" opacity="0.6" />
        ))}
        {/* Horizontal bands */}
        <rect x="-85" y="-95" width="170" height="8" fill="#3F3F45" rx="2" />
        <rect x="-85" y="87"  width="170" height="8" fill="#3F3F45" rx="2" />
        {/* Bottom decoration */}
        <path d="M -65 95 L 65 95 L 50 120 L -50 120 Z" fill="#3F3F45" />
        <path d="M -25 120 L 25 120 L 15 145 L -15 145 Z" fill="#5B5B63" />
        <circle cx="0" cy="150" r="6" fill="#86868F" />
      </g>

      {/* Floating mini lanterns */}
      {[
        { x: w * 0.15, y: h * 0.25, s: 0.18 },
        { x: w * 0.85, y: h * 0.32, s: 0.15 },
        { x: w * 0.20, y: h * 0.7,  s: 0.12 },
        { x: w * 0.82, y: h * 0.75, s: 0.20 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s * lanternScale})`} opacity="0.7">
          <circle r="200" fill="url(#lg-glow)" />
          <ellipse rx="60" ry="80" fill="url(#lg-lantern)" />
        </g>
      ))}

      {/* Greeting */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.66 : 0.74)}
        textAnchor="middle"
        fontSize={isPost ? 50 : 92}
        fontWeight="900"
        fill="#FFE3D0"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-1"
      >
        عيد سعيد
      </text>
      <text
        x={w / 2}
        y={h * (isStory ? 0.69 : 0.79)}
        textAnchor="middle"
        fontSize={isPost ? 18 : 26}
        fontWeight="400"
        fill="#FFA068"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
        letterSpacing="2"
      >
        أضاء الله أيامكم بالفرح والسرور
      </text>

      {/* Bottom signature */}
      <text
        x={w / 2}
        y={h - 50}
        textAnchor="middle"
        fontSize={isPost ? 16 : 22}
        fontWeight="900"
        fill="#F26B1F"
        letterSpacing="8"
      >
        DARB · درب
      </text>
    </svg>
  );
};

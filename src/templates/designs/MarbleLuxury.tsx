import type { ArtworkRenderer } from '../types';

/**
 * Marble Luxury — premium marble texture with gold foil veins and a
 * minimalist gold frame. Closest to a luxury invitation card.
 */
export const MarbleLuxury: ArtworkRenderer = ({ format }) => {
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
        <linearGradient id="ml-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAFAFB" />
          <stop offset="50%" stopColor="#FFF8F0" />
          <stop offset="100%" stopColor="#EFEFF1" />
        </linearGradient>
        <linearGradient id="ml-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F26B1F" />
          <stop offset="40%" stopColor="#FFE3D0" />
          <stop offset="60%" stopColor="#F26B1F" />
          <stop offset="100%" stopColor="#A93F09" />
        </linearGradient>
        <filter id="ml-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width={w} height={h} fill="url(#ml-bg)" />

      {/* Marble veins — organic curved paths */}
      <g opacity="0.4" filter="url(#ml-soft)">
        <path
          d={`M -50 ${h * 0.2} Q ${w * 0.3} ${h * 0.1} ${w * 0.6} ${h * 0.35} T ${w + 50} ${h * 0.3}`}
          stroke="#B9B9C0" strokeWidth="2" fill="none"
        />
        <path
          d={`M -50 ${h * 0.6} Q ${w * 0.4} ${h * 0.5} ${w * 0.7} ${h * 0.7} T ${w + 50} ${h * 0.65}`}
          stroke="#86868F" strokeWidth="1.5" fill="none"
        />
        <path
          d={`M ${w * 0.1} -50 Q ${w * 0.15} ${h * 0.4} ${w * 0.3} ${h * 0.5} T ${w * 0.4} ${h + 50}`}
          stroke="#B9B9C0" strokeWidth="1" fill="none"
        />
        <path
          d={`M ${w * 0.8} -50 Q ${w * 0.85} ${h * 0.3} ${w * 0.75} ${h * 0.6} T ${w * 0.9} ${h + 50}`}
          stroke="#86868F" strokeWidth="1" fill="none"
        />
      </g>

      {/* Gold foil veins — accent */}
      <g opacity="0.7">
        <path
          d={`M -50 ${h * 0.15} Q ${w * 0.4} ${h * 0.05} ${w * 0.8} ${h * 0.25} T ${w + 50} ${h * 0.18}`}
          stroke="url(#ml-gold)" strokeWidth="2.5" fill="none"
        />
        <path
          d={`M -50 ${h * 0.82} Q ${w * 0.3} ${h * 0.72} ${w * 0.6} ${h * 0.88} T ${w + 50} ${h * 0.85}`}
          stroke="url(#ml-gold)" strokeWidth="2" fill="none"
        />
      </g>

      {/* Outer gold frame */}
      <rect
        x="50" y="50" width={w - 100} height={h - 100}
        fill="none" stroke="url(#ml-gold)" strokeWidth="3"
        rx="8"
      />
      <rect
        x="70" y="70" width={w - 140} height={h - 140}
        fill="none" stroke="#F26B1F" strokeWidth="0.8" opacity="0.5"
        rx="4"
      />

      {/* Top ornament — diamond */}
      <g transform={`translate(${w / 2} ${h * (isStory ? 0.22 : 0.24)})`}>
        <path d="M 0 -20 L 16 0 L 0 20 L -16 0 Z" fill="url(#ml-gold)" />
        <line x1="-80" y1="0" x2="-22" y2="0" stroke="url(#ml-gold)" strokeWidth="1.5" />
        <line x1="22" y1="0" x2="80" y2="0" stroke="url(#ml-gold)" strokeWidth="1.5" />
        <circle cx="-90" cy="0" r="3" fill="#F26B1F" />
        <circle cx="90" cy="0" r="3" fill="#F26B1F" />
      </g>

      {/* Title — small caps */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.27 : 0.30)}
        textAnchor="middle"
        fontSize={isPost ? 14 : 20}
        fontWeight="700"
        fill="#A93F09"
        letterSpacing="10"
      >
        EID AL-ADHA · {new Date().getFullYear()}
      </text>

      {/* Main greeting */}
      <text
        x={w / 2}
        y={h * (isStory ? 0.36 : 0.42)}
        textAnchor="middle"
        fontSize={isPost ? 64 : 116}
        fontWeight="900"
        fill="#0E0E10"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', serif"
        letterSpacing="-2"
      >
        عيد أضحى مبارك
      </text>

      <text
        x={w / 2}
        y={h * (isStory ? 0.40 : 0.49)}
        textAnchor="middle"
        fontSize={isPost ? 18 : 28}
        fontWeight="400"
        fill="#5B5B63"
        fontFamily="'DIN Next Arabic', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif"
        fontStyle="italic"
      >
        نتقدم لكم بأجمل التهاني وأطيب الأماني
      </text>

      {/* Bottom ornament */}
      <g transform={`translate(${w / 2} ${h - 100})`}>
        <line x1="-100" y1="0" x2="-22" y2="0" stroke="url(#ml-gold)" strokeWidth="1.5" />
        <line x1="22" y1="0" x2="100" y2="0" stroke="url(#ml-gold)" strokeWidth="1.5" />
        <circle r="6" fill="url(#ml-gold)" />
        <circle r="12" fill="none" stroke="#F26B1F" strokeWidth="1" />
      </g>

      <text
        x={w / 2}
        y={h - 50}
        textAnchor="middle"
        fontSize={isPost ? 14 : 20}
        fontWeight="900"
        fill="#A93F09"
        letterSpacing="10"
      >
        DARB · درب
      </text>
    </svg>
  );
};

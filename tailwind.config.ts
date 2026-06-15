import type { Config } from 'tailwindcss';

/**
 * Darb brand tokens.
 *
 * EDIT BRAND COLORS HERE — these flow through the entire UI.
 * If you re-skin for a different brand, this is the only file you need to touch
 * for the palette. Component-level utilities reference these tokens by name.
 */
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Darb signature orange — used for primary actions, accents, highlights.
        brand: {
          50:  '#FFF4EC',
          100: '#FFE3D0',
          200: '#FFC6A1',
          300: '#FFA068',
          400: '#FF7E3A',
          500: '#F26B1F', // primary
          600: '#D8540F',
          700: '#A93F09',
          800: '#7C2D05',
          900: '#4F1B02',
        },
        // Neutral gray family for backgrounds, borders, body text.
        ink: {
          50:  '#F7F7F8',
          100: '#EFEFF1',
          200: '#DCDCE0',
          300: '#B9B9C0',
          400: '#86868F',
          500: '#5B5B63',
          600: '#3F3F45',
          700: '#2C2C30',
          800: '#1A1A1D',
          900: '#0E0E10',
        },
      },
      fontFamily: {
        // Arabic-first stack — see globals.css for @font-face wiring.
        // Order: DIN Next Arabic (commercial, drop in /public/fonts) →
        //        IBM Plex Sans Arabic (free DIN-like) → Cairo / Tajawal.
        sans: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-arabic)', 'serif'],
      },
      boxShadow: {
        'brand-glow': '0 20px 60px -20px rgba(242,107,31,0.35)',
        'soft': '0 4px 24px -8px rgba(14,14,16,0.10)',
        'card': '0 8px 32px -12px rgba(14,14,16,0.18)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #F26B1F 0%, #FF9B5E 100%)',
        'dark-gradient':  'linear-gradient(135deg, #0E0E10 0%, #2C2C30 100%)',
      },
    },
  },
  plugins: [],
};

export default config;

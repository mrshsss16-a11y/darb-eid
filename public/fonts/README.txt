DIN Next Arabic fonts go here.

The platform's font stack uses DIN Next Arabic if available, otherwise
falls back gracefully to IBM Plex Sans Arabic (free, DIN-like) → Cairo → Tajawal.

To enable the real DIN Next Arabic typeface:

  1. Get the font from Monotype (commercial licence):
     https://www.monotype.com/fonts/din-next-arabic

  2. Convert each weight to WOFF2 (use https://transfonter.org or fonttools).

  3. Drop the files in THIS folder with EXACTLY these names (case-sensitive):
       DINNextArabic-Light.woff2
       DINNextArabic-Regular.woff2
       DINNextArabic-Medium.woff2
       DINNextArabic-Bold.woff2

  4. Restart the dev server (npm run dev) or redeploy.
     The font is picked up automatically from /src/app/globals.css
     (search for "@font-face" in that file).

If you don't have a commercial DIN licence, the default "IBM Plex Sans
Arabic" is the closest free alternative and most viewers won't notice.

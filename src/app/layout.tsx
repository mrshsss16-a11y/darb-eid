import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.darbstations.com.sa';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'بطاقات درب | Darb Greetings',
  description:
    'اختر قالب المعايدة، أضف اسمك، وحمّل بطاقتك. منصة درب الداخلية لإنشاء بطاقات معايدة عيد الأضحى المبارك.',
  keywords: ['Darb', 'درب', 'عيد الأضحى', 'معايدة', 'بطاقات معايدة'],
  authors: [{ name: 'Darb' }],
  applicationName: 'Darb Greetings',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'بطاقات درب',
    description: 'اختر قالب المعايدة، أضف اسمك، وحمّل بطاقتك',
    type: 'website',
    locale: 'ar_SA',
    siteName: 'Darb Greetings',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F26B1F' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0E10' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light dark',
};

/**
 * FONT LOADING NOTE
 * The card templates reference the literal family names 'DIN Next Arabic',
 * 'IBM Plex Sans Arabic', 'Cairo' and 'Tajawal', and html-to-image embeds
 * whatever is in document.fonts at export time. next/font would rename the
 * families to hashed names (and self-host them), which silently breaks
 * name-printing in the exported PNG. So we keep the @import in globals.css
 * (font-display: swap) and only warm up the connections + preload the
 * self-hosted DIN Regular file, which is the first font in every stack.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="/fonts/DINNextLTArabic-Regular-3.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('darb-theme');
                const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = stored || system;
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

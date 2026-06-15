import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'بطاقات درب | Darb Greetings',
  description:
    'اختر قالب المعايدة، أضف اسمك، وحمّل بطاقتك. منصة درب الداخلية لإنشاء بطاقات معايدة عيد الأضحى المبارك.',
  keywords: ['Darb', 'درب', 'عيد الأضحى', 'معايدة', 'بطاقات معايدة'],
  authors: [{ name: 'Darb' }],
  openGraph: {
    title: 'بطاقات درب',
    description: 'اختر قالب المعايدة، أضف اسمك، وحمّل بطاقتك',
    type: 'website',
    locale: 'ar_SA',
  },
};

export const viewport: Viewport = {
  themeColor: '#F26B1F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
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

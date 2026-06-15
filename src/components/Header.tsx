'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Shield } from 'lucide-react';
import { DarbLogo } from './DarbLogo';
import { useTheme } from './ThemeProvider';

export function Header() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/70 dark:border-ink-800/70 backdrop-blur-xl bg-white/70 dark:bg-ink-900/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <Link
            href="/"
            className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <DarbLogo height={36} />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="rounded-2xl p-2.5 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-brand-400" />
              ) : (
                <Moon className="h-5 w-5 text-ink-700" />
              )}
            </button>

            <Link
              href={isAdmin ? '/' : '/admin'}
              className="inline-flex items-center gap-2 rounded-2xl px-3 sm:px-4 py-2.5 text-sm font-bold text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isAdmin ? 'العودة للمنصة' : 'لوحة الإدارة'}
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

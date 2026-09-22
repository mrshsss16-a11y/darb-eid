'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { checkAdminSession, AdminSessionExpiredError } from '@/utils/adminDbClient';

/**
 * Lightweight client-side password gate.
 *
 * SECURITY:
 *  - Password is verified via POST /api/admin-auth (server-side Route Handler).
 *  - The actual password value is stored in ADMIN_PASSWORD env var (NO NEXT_PUBLIC_
 *    prefix) so it is NEVER included in the client bundle or visible in DevTools.
 *  - The HttpOnly session cookie is the single source of truth: on mount we ask
 *    GET /api/admin/session whether it is still valid. Nothing is kept in
 *    sessionStorage/localStorage.
 *  - Write handlers that receive `AdminSessionExpiredError` (401 from the
 *    gateway) call `notifyAdminSessionExpired()` so the login form re-appears.
 *
 * For production-grade auth, replace this with NextAuth + an Identity Provider
 * (Microsoft 365 / Google Workspace SSO).
 */
const SESSION_EXPIRED_EVENT = 'darb-admin-session-expired';
const LEGACY_FLAG_KEY = 'darb-admin-ok';

/** Re-show the admin login (call after catching AdminSessionExpiredError). */
export function notifyAdminSessionExpired() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/**
 * Helper for write handlers: if `err` is a session-expiry error, re-show the
 * login and return true; otherwise return false so the caller shows its own
 * error message.
 */
export function handleAdminWriteError(err: unknown): boolean {
  if (err instanceof AdminSessionExpiredError) {
    notifyAdminSessionExpired();
    return true;
  }
  return false;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [expiredNotice, setExpiredNotice] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      sessionStorage.removeItem(LEGACY_FLAG_KEY);
    } catch {}
    checkAdminSession().then((ok) => {
      if (!active) return;
      setAuthed(ok);
      setChecking(false);
    });

    const onExpired = () => {
      setAuthed(false);
      setExpiredNotice(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      active = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setAuthed(true);
        setExpiredNotice(false);
        setError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setError('تعذر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  const logout = useCallback(async () => {
    setAuthed(false);
    setPassword('');
    setExpiredNotice(false);
    try {
      await fetch('/api/admin-logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
  }, []);

  if (checking) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-ink-500">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="mt-3 text-sm">جارٍ التحقق من الجلسة…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="card-surface p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 grid place-items-center mb-4">
            <ShieldCheck className="h-8 w-8 text-brand-500" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
            لوحة الإدارة
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            هذه المنطقة محمية. الرجاء إدخال كلمة المرور الإدارية.
          </p>
          {expiredNotice && (
            <p className="mt-3 text-sm font-bold text-amber-700 dark:text-amber-400">
              انتهت جلسة الإدارة. سجّل الدخول مرة أخرى للمتابعة.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-3 text-right">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="كلمة المرور"
              className="input-field"
              aria-invalid={!!error}
              disabled={loading}
            />
            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                'دخول'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
        <p className="inline-flex items-center gap-2 label-tag">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>وضع الإدارة مفعّل</span>
        </p>
        <button onClick={logout} className="btn-ghost">
          <LogOut className="h-4 w-4" />
          <span>تسجيل خروج</span>
        </button>
      </div>
      {children}
    </div>
  );
}

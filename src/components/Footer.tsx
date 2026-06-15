export function Footer() {
  return (
    <footer className="border-t border-ink-100 dark:border-ink-800 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-500 dark:text-ink-400">
          <p>
            © {new Date().getFullYear()} درب — جميع الحقوق محفوظة لإدارة التسويق
          </p>
          <p className="text-xs">
            منصة داخلية لإنشاء بطاقات المعايدة
          </p>
        </div>
      </div>
    </footer>
  );
}

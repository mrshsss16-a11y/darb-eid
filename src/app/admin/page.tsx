import { AdminGate } from '@/components/admin/AdminGate';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'لوحة الإدارة | درب',
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}

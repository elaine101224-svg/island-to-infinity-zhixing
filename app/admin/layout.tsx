import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { ToastProvider } from '@/components/admin/Toast';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await validateSession();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <ToastProvider>
      <div className="admin-console flex flex-col md:flex-row admin-shell min-h-screen bg-cream font-sans">
        <AdminNavigation />
        <main id="admin-main" tabIndex={-1} className="flex-1 min-w-0">
          <div className="console-content">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}

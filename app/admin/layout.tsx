import { redirect } from 'next/navigation';
import { validateSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminNavbar';
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
      <div className="flex flex-col md:flex-row admin-shell min-h-screen bg-cream font-sans">
        <AdminSidebar />
        <main id="admin-main" tabIndex={-1} className="flex-1 min-w-0">
          <div className="p-5 sm:p-7 lg:p-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
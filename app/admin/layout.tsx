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
      <div className="flex min-h-screen bg-sand/40 font-sans">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin | Ivania Beauty",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();

  // If not authenticated, render children without AdminShell
  // (allows /admin/login to render; middleware handles redirects for other pages)
  if (!admin) {
    return <>{children}</>;
  }

  return (
    <AdminShell
      admin={{
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl || null,
      }}
    >
      {children}
    </AdminShell>
  );
}

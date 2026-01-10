import { redirect } from "next/navigation";
import { getAdminRole } from "@/lib/adminAuth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getAdminRole();

  if (!role || role === "user") {
    redirect("/dashboard");
  }

  const isSuperAdmin = role === "super_admin";

  return <AdminLayoutClient role={role} isSuperAdmin={isSuperAdmin}>{children}</AdminLayoutClient>;
}

import { AdminThemeShell } from "@/components/admin-theme-shell";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifyAdminSessionToken(token))) {
    redirect("/admin/login");
  }

  return (
    <AdminThemeShell>
      {!isDatabaseConfigured() ? (
        <div className="admin-notice admin-notice-warn mb-8">
          DATABASE_URL is not set — admin data pages will fail until Postgres is
          configured.
        </div>
      ) : null}
      {children}
    </AdminThemeShell>
  );
}

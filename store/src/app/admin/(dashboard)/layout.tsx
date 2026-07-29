import { AdminThemeShell } from "@/components/admin-theme-shell";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/inventory", label: "Inventory" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return (
    <AdminThemeShell
      header={
        <>
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--admin-accent)]">
              NestPaw internal
            </p>
            <p className="font-display text-xl font-semibold tracking-[-0.03em]">
              Admin
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] transition hover:text-[color:var(--admin-fg)]"
              >
                {item.label}
              </Link>
            ))}
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-subtle)] transition hover:text-[color:var(--admin-fg)]"
              >
                Log out
              </button>
            </form>
          </nav>
        </>
      }
    >
      {!isDatabaseConfigured() ? (
        <div className="mb-8 border border-[color:var(--admin-warning-border)] bg-[var(--admin-warning-bg)] px-4 py-3 text-sm text-[color:var(--admin-warning-fg)]">
          DATABASE_URL is not set — admin data pages will fail until Postgres is
          configured.
        </div>
      ) : null}
      {children}
    </AdminThemeShell>
  );
}

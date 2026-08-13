import { AdminThemeShell } from "@/components/admin-theme-shell";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (await verifyAdminSessionToken(token)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/admin") ? params.next : "/admin";

  return (
    <AdminThemeShell centered>
      <div className="admin-card w-full p-8">
        <p className="text-xs font-semibold tracking-wide text-[color:var(--admin-accent)]">
          NestPaw
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[color:var(--admin-muted)]">
          Enter the admin password to manage orders and inventory.
        </p>

        {params.error ? (
          <p className="admin-notice admin-notice-danger mt-6">
            Incorrect password.
          </p>
        ) : null}

        <form action="/api/admin/login" method="post" className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="admin-input"
            />
          </label>
          <button type="submit" className="btn-primary w-full">
            Continue
          </button>
        </form>
      </div>
    </AdminThemeShell>
  );
}

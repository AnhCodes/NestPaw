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
  if (verifyAdminSessionToken(token)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/admin") ? params.next : "/admin";

  return (
    <AdminThemeShell centered>
      <div className="w-full max-w-md border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-8 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--admin-accent)]">
          NestPaw
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em]">
          Admin login
        </h1>
        <p className="mt-3 text-sm text-[color:var(--admin-muted)]">
          Enter the shared admin password to manage orders and inventory.
        </p>

        {params.error ? (
          <p className="mt-6 border border-[color:var(--admin-danger-border)] bg-[var(--admin-danger-bg)] px-4 py-3 text-sm text-[color:var(--admin-danger-fg)]">
            Incorrect password.
          </p>
        ) : null}

        <form action="/api/admin/login" method="post" className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm font-medium text-[color:var(--admin-fg)]">
            Password
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-sm text-[color:var(--admin-fg)] outline-none placeholder:text-[color:var(--admin-subtle)] focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
            />
          </label>
          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
        </form>
      </div>
    </AdminThemeShell>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { NestPawLogo } from "@/components/nestpaw-logo";

type Theme = "dark" | "light";

const STORAGE_KEY = "nestpaw-admin-theme";
const themeListeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "dark" ? "dark" : "light";
}

function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    themeListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setStoredTheme(next: Theme) {
  window.localStorage.setItem(STORAGE_KEY, next);
  themeListeners.forEach((listener) => listener());
}

const nav = [
  { href: "/admin", label: "Overview", icon: OverviewIcon },
  { href: "/admin/orders", label: "Orders and Fulfillment", icon: FulfillmentIcon },
  { href: "/admin/customers", label: "Customers", icon: CustomersIcon },
  { href: "/admin/inventory", label: "Inventory", icon: InventoryIcon },
  { href: "/admin/investors", label: "Investors", icon: InvestorsIcon },
  { href: "/admin/tools", label: "Tools and Services", icon: ToolsIcon },
];

function OverviewIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FulfillmentIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="2.5" y="4" width="4" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="4" width="4" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13.5" y="4" width="4" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="10" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.8 16c.8-2.6 2.7-4 5.2-4s4.4 1.4 5.2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M3.5 7.2 10 3.8l6.5 3.4v6.4L10 16.8 3.5 13.6V7.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 16.8V10M3.5 7.2 10 10l6.5-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function InvestorsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M4 14.5 8 10l3 3 5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
      <rect x="2.5" y="7" width="10" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7V6a1.5 1.5 0 0 1 1.5-1.5H16A1.5 1.5 0 0 1 17.5 6v7.5A1.5 1.5 0 0 1 16 15h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AdminThemeShell({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  const pathname = usePathname();
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => "light" as Theme,
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const style = useMemo(
    () =>
      ({
        "--admin-bg": theme === "dark" ? "#101211" : "#f3f4f3",
        "--admin-surface": theme === "dark" ? "#181b19" : "#ffffff",
        "--admin-surface-soft": theme === "dark" ? "#1e2220" : "#f6f7f6",
        "--admin-fg": theme === "dark" ? "#eef0ee" : "#141816",
        "--admin-muted": theme === "dark" ? "#9aa29d" : "#5e6762",
        "--admin-subtle": theme === "dark" ? "#7a827d" : "#8a928e",
        "--admin-border": theme === "dark" ? "#2a2e2c" : "#e4e7e4",
        "--admin-accent": theme === "dark" ? "#8fafa0" : "#1f3d32",
        "--admin-accent-hover": theme === "dark" ? "#7d9c8e" : "#163028",
        "--admin-hover": theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(20,24,22,0.035)",
        "--admin-input": theme === "dark" ? "#121412" : "#ffffff",
        "--admin-warning-bg": theme === "dark" ? "rgba(245,158,11,0.12)" : "#fff7e8",
        "--admin-warning-border": theme === "dark" ? "rgba(245,158,11,0.28)" : "#f0d9a8",
        "--admin-warning-fg": theme === "dark" ? "#f3d089" : "#8a5a00",
        "--admin-danger-bg": theme === "dark" ? "rgba(239,68,68,0.12)" : "#fef2f2",
        "--admin-danger-border": theme === "dark" ? "rgba(239,68,68,0.28)" : "#f1c5c5",
        "--admin-danger-fg": theme === "dark" ? "#f0b4b4" : "#991b1b",
      }) as React.CSSProperties,
    [theme],
  );

  const toggleTheme = () => {
    setStoredTheme(theme === "dark" ? "light" : "dark");
  };

  if (centered) {
    return (
      <div style={style} className="admin-app">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5">
          {children}
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <NestPawLogo
          href="/admin"
          className="text-[color:var(--admin-fg)]"
          wordmarkClassName="text-[1.25rem] md:text-[1.35rem]"
          markClassName="h-7 w-7 md:h-7 md:w-7"
        />
        <p className="mt-2 text-[0.7rem] font-medium text-[color:var(--admin-subtle)]">
          Operations
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {nav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--admin-surface-soft)] text-[color:var(--admin-fg)]"
                  : "text-[color:var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[color:var(--admin-fg)]"
              }`}
            >
              <span className={active ? "text-[color:var(--admin-accent)]" : ""}>
                <Icon />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-[color:var(--admin-border)] px-3 py-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-[color:var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[color:var(--admin-fg)]"
        >
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-[color:var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[color:var(--admin-fg)]"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={style} className="admin-app">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[color:var(--admin-border)] bg-[var(--admin-surface)] lg:sticky lg:top-0 lg:block lg:h-screen">
          {sidebar}
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[color:var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 lg:hidden">
            <NestPawLogo
              href="/admin"
              className="text-[color:var(--admin-fg)]"
              wordmarkClassName="text-[1.2rem]"
              markClassName="h-7 w-7"
            />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg border border-[color:var(--admin-border)] px-3 py-2 text-sm font-medium text-[color:var(--admin-muted)]"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              Menu
            </button>
          </header>

          {menuOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <aside className="relative h-full w-[15.5rem] bg-[var(--admin-surface)] shadow-xl">
                {sidebar}
              </aside>
            </div>
          ) : null}

          <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

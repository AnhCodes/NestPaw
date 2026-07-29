"use client";

import { useMemo, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "nestpaw-admin-theme";

export function AdminThemeShell({
  header,
  children,
  centered = false,
}: {
  header?: ReactNode;
  children: ReactNode;
  centered?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  const style = useMemo(
    () =>
      ({
        "--admin-bg": theme === "dark" ? "#0b1210" : "#f4f7f4",
        "--admin-surface": theme === "dark" ? "#101916" : "#ffffff",
        "--admin-surface-soft": theme === "dark" ? "rgba(255,255,255,0.04)" : "#edf2ee",
        "--admin-fg": theme === "dark" ? "#edf3ef" : "#122019",
        "--admin-muted": theme === "dark" ? "rgba(237,243,239,0.65)" : "rgba(18,32,25,0.68)",
        "--admin-subtle": theme === "dark" ? "rgba(237,243,239,0.45)" : "rgba(18,32,25,0.48)",
        "--admin-border": theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(18,32,25,0.12)",
        "--admin-accent": "#7ec7a0",
        "--admin-hover": theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(18,32,25,0.05)",
        "--admin-input": theme === "dark" ? "#0b1210" : "#f7faf7",
        "--admin-warning-bg": theme === "dark" ? "rgba(245,158,11,0.10)" : "#fff4db",
        "--admin-warning-border": theme === "dark" ? "rgba(245,158,11,0.25)" : "#f2cd7a",
        "--admin-warning-fg": theme === "dark" ? "#fde68a" : "#8a5a00",
        "--admin-danger-bg": theme === "dark" ? "rgba(239,68,68,0.10)" : "#fff0f0",
        "--admin-danger-border": theme === "dark" ? "rgba(239,68,68,0.25)" : "#f5b5b5",
        "--admin-danger-fg": theme === "dark" ? "#fecaca" : "#991b1b",
      }) as React.CSSProperties,
    [theme],
  );

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <div
      style={style}
      className="min-h-screen bg-[var(--admin-bg)] text-[color:var(--admin-fg)] transition-colors"
    >
      {header ? (
        <header className="border-b border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
            {header}
            <button
              type="button"
              onClick={toggleTheme}
              className="border border-[color:var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[color:var(--admin-fg)]"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </header>
      ) : (
        <div className="mx-auto flex max-w-6xl justify-end px-5 pt-5 md:px-8">
          <button
            type="button"
            onClick={toggleTheme}
            className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[color:var(--admin-fg)]"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      )}

      <div
        className={`mx-auto max-w-6xl px-5 pb-10 pt-10 md:px-8 md:pb-12 md:pt-12 ${
          centered ? "flex min-h-[calc(100vh-5rem)] items-center justify-center" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { NestPawLogo } from "@/components/nestpaw-logo";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Story" },
  { href: "/shipping", label: "Shipping" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  return (
    <header className="relative z-50 border-b border-line bg-canvas">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5 md:h-[4.75rem] md:px-8">
        <NestPawLogo priority className="h-7 w-auto md:h-8" />

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ink transition hover:text-leaf"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-2xl border border-line px-3.5 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink transition hover:border-accent hover:bg-accent"
          >
            Cart
            {hydrated && itemCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center bg-moss px-1 text-[0.7rem] text-mist">
                {itemCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1.5">
              <span
                className={`block h-0.5 w-5 bg-ink transition ${open ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-ink transition ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 bg-ink transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </div>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-canvas px-5 py-7 md:hidden">
          <nav className="flex flex-col gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-display text-2xl font-medium text-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

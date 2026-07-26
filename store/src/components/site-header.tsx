"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { NestPawLogo } from "@/components/nestpaw-logo";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=bundle", label: "Bundles" },
  { href: "/about", label: "Story" },
  { href: "/shipping", label: "Shipping" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { itemCount, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const inverted = isHome && !scrolled && !open;

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-line bg-canvas/85 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5 md:h-[4.75rem] md:px-8">
        <NestPawLogo className={inverted ? "text-mist" : "text-ink"} />

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[0.8rem] font-medium uppercase tracking-[0.14em] transition ${
                inverted
                  ? "text-mist/75 hover:text-mist"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/cart"
            className={`relative inline-flex items-center gap-2 border px-3.5 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition ${
              inverted
                ? "border-mist/35 text-mist hover:border-mist hover:bg-mist/10"
                : "border-line text-ink hover:border-ink/30 hover:bg-surface"
            }`}
          >
            Cart
            {hydrated && itemCount > 0 ? (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center px-1 text-[0.7rem] ${
                  inverted ? "bg-mist text-ink" : "bg-moss text-mist"
                }`}
              >
                {itemCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center border md:hidden ${
              inverted ? "border-mist/35" : "border-line"
            }`}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1.5">
              <span
                className={`block h-0.5 w-5 transition ${
                  inverted ? "bg-mist" : "bg-ink"
                } ${open ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 transition ${
                  inverted ? "bg-mist" : "bg-ink"
                } ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 transition ${
                  inverted ? "bg-mist" : "bg-ink"
                } ${open ? "-translate-y-2 -rotate-45" : ""}`}
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
                className="font-display text-2xl font-semibold text-ink"
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

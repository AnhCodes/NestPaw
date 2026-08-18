import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-12 md:px-8 md:pt-16">
      <h1 className="font-display text-4xl text-ink">Page not found</h1>
      <p className="mt-4 text-ink/70">
        That page wandered off. Let&apos;s get you back to the collection.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-flex rounded-2xl bg-moss px-6 py-3.5 text-sm font-medium text-mist"
      >
        Shop NestPaw
      </Link>
    </div>
  );
}

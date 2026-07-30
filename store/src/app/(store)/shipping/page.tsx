import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Shipping & returns",
  description:
    "NestPaw shipping timelines, delivery windows, and return policy for U.S. orders.",
  path: "/shipping",
});

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <p className="text-xs uppercase tracking-[0.22em] text-leaf">Policies</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
        Shipping & returns
      </h1>

      <section className="mt-10 space-y-4 text-ink/75">
        <h2 className="font-display text-2xl text-ink">Shipping</h2>
        <p>
          Free shipping on U.S. orders over $40. Orders under $40 ship for a
          flat $4.95. We typically dispatch within 24 hours when items are in
          stock. Most deliveries arrive in 5 to 8 business days depending on
          destination and carrier.
        </p>
        <p>
          You&apos;ll receive tracking once your order ships. Delivery windows
          on product pages reflect our current partner fulfillment times.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-ink/75">
        <h2 className="font-display text-2xl text-ink">Product photos &amp; colors</h2>
        <p>
          Product photos show the same item style you&apos;ll receive. Colors
          may vary from what&apos;s pictured depending on available stock. If a
          specific color matters to you, contact us before ordering.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-ink/75">
        <h2 className="font-display text-2xl text-ink">Returns</h2>
        <p>
          We offer a 30-day return window for unused items in original condition,
          and for defective products. Contact us with your order number to start
          a return. Refunds are issued to the original payment method after we
          receive and review the return.
        </p>
        <p>
          Opened consumables and heavily used items may not qualify unless
          defective. If something arrives damaged, send photos within 7 days and
          we&apos;ll make it right.
        </p>
      </section>

      <Link
        href="/contact"
        className="mt-10 inline-flex bg-moss px-6 py-3.5 text-sm font-medium text-mist transition hover:bg-moss-deep"
      >
        Contact support
      </Link>
    </div>
  );
}

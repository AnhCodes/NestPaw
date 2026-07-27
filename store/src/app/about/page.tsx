import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Our story",
  description:
    "NestPaw makes intentional calm, enrichment, and grooming tools for dogs at home — fewer gimmicks, better routines.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <p className="text-xs uppercase tracking-[0.22em] text-leaf">Our story</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
        Made for the quiet parts of dog life
      </h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-ink/75 md:text-lg">
        <p>
          NestPaw started from a simple observation: most pet stores sell
          everything, so nothing feels intentional. We sell a focused set of
          comfort, enrichment, and grooming tools for dogs who share a home —
          and for the people who clean the floors afterward.
        </p>
        <p>
          Our promise is practical calm. Less fur on the couch. A rainy evening
          that doesn&apos;t turn into restless pacing. Nail care that doesn&apos;t
          feel like a struggle. We avoid medical claims and megastore clutter in
          favor of products you can actually demo, use, and keep.
        </p>
        <p>
          Every order is fulfilled through vetted partners with U.S.-friendly
          shipping windows. When something isn&apos;t right, our 30-day return
          window is there so you can shop with confidence.
        </p>
      </div>
    </div>
  );
}

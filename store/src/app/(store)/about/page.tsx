import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Our story",
  description:
    "NestPaw exists to help you care for your dog with more calm, patience, and everyday love at home.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <p className="text-xs uppercase tracking-[0.22em] text-leaf">Our story</p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
        Built for the love you already give
      </h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-ink/75 md:text-lg">
        <p>
          Every dog person knows the feeling: you want to do right by them.
          Softer evenings. Gentler grooming. A home that feels peaceful for
          both of you. NestPaw started from that care, not from a crowded pet
          aisle full of things you will never use.
        </p>
        <p>
          We believe good dog care is made of small, steady moments. A meal that
          lasts long enough for them to settle. Coat care that doesn&apos;t feel
          like a battle. A quiet game that gives restless energy somewhere kind
          to go. Our tools are chosen to support those moments, so loving your
          dog well feels a little easier every day.
        </p>
        <p>
          We keep the collection focused on purpose. No medical claims. No
          megastore clutter. Just thoughtful calm, enrichment, and grooming
          pieces meant for real homes and real routines, with honest shipping and
          a 30-day return window when something isn&apos;t right.
        </p>
        <p>
          At the heart of NestPaw is a simple wish: that your dog feels safe,
          comfortable, and understood, and that you feel supported in caring for
          them. That is the story we are building, one calmer day at a time.
        </p>
      </div>
    </div>
  );
}

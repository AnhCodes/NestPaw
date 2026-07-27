import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

const featured = products.filter((p) => p.featured);
const heroFeature = featured[0];
const sideFeatures = featured.slice(1, 3);
const marqueeItems = [
  "Free shipping over $40",
  "Ships within 24 hours",
  "30-day returns",
  "Calm\u00a0·\u00a0Groom\u00a0·\u00a0Enrichment",
  "U.S. delivery 5–8 days",
  "No medical claims — just better home routines",
];

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-ink">
        <Image
          src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=2000&q=80"
          alt="Calm dog resting at home"
          fill
          priority
          className="animate-hero-media object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,14,12,0.72)_0%,rgba(8,14,12,0.35)_45%,rgba(8,14,12,0.55)_100%)]" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-14 pt-28 md:px-8 md:pb-20">
          <p className="animate-fade font-display text-[clamp(3.5rem,12vw,8.5rem)] font-bold leading-[0.9] text-mist">
            NestPaw
          </p>
          <div className="mt-8 max-w-3xl md:mt-10">
            <h1 className="animate-rise delay-1 max-w-xl font-display text-3xl font-semibold leading-[1.05] text-mist md:text-4xl lg:text-5xl">
              Calm comfort for dogs at home
            </h1>
            <p className="animate-rise delay-2 mt-4 max-w-md text-base leading-relaxed text-mist/80 md:text-lg">
              Products that help your dog feel settled — and make everyday home
              life easier for you.
            </p>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-line bg-moss py-3.5 text-mist">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap px-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em]">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={`${item}-${i}`} className="flex items-center gap-10">
              {item}
              <span className="text-mist/35">/</span>
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
              Why NestPaw
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] text-ink md:text-6xl">
              Built for calmer evenings and cleaner floors
            </h2>
          </div>
          <p className="text-base leading-relaxed text-ink-soft md:text-lg">
            A tight Core 4 — enrichment and grooming tools, not another endless
            pet aisle. Each piece solves a real home friction: shedding,
            restless energy, and rushed mealtimes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
              Featured
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink md:text-5xl">
              Start here
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/60 transition hover:text-ink sm:inline"
          >
            View all →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {heroFeature ? <ProductCard product={heroFeature} /> : null}
          {sideFeatures.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {products
            .filter((p) => !featured.slice(0, 3).some((f) => f.id === p.id))
            .slice(0, 3)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
        <Link
          href="/shop"
          className="mt-8 inline-flex text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/60 sm:hidden"
        >
          View all →
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid overflow-hidden border border-line bg-surface md:grid-cols-2">
          <div className="relative min-h-[22rem] bg-[#d8e0da] md:min-h-[34rem]">
            <Image
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1400&q=80"
              alt="Dog enjoying enrichment at home"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-12 md:px-12 md:py-16">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
              Our promise
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.05] text-ink md:text-5xl">
              Practical calm, not pet-store noise
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft md:text-lg">
              Free shipping over&nbsp;$40. Honest delivery windows. A 30-day return
              window on unused or defective items. No medical claims — just tools
              that make home life with your dog feel smoother.
            </p>
            <Link href="/about" className="btn-primary mt-8 w-fit">
              Read our story
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

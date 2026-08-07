import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { StockStatus } from "@/components/stock-status";
import {
  getProductWithStock,
  getProductsWithStock,
} from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";
import { formatPrice, getProduct, products } from "@/lib/products";
import { getSiteUrl } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product" };
  return createPageMetadata({
    title: product.name,
    description: product.tagline,
    path: `/products/${slug}`,
    image: `${getSiteUrl()}${product.image}`,
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductWithStock(slug);
  if (!product) notFound();

  const all = await getProductsWithStock();
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const pairingNudge =
    product.slug === "forage-snuffle-mat"
      ? await getProductWithStock("suction-lick-mat")
      : null;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-3">
          <div className="relative aspect-[2/3] overflow-hidden bg-stone">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="pointer-events-none absolute right-3 top-3 z-10 md:right-4 md:top-4">
              <StockStatus product={product} tone="badge" />
            </div>
          </div>
          {product.gallery.length > 1 ? (
            <div className="grid grid-cols-2 gap-4">
              {product.gallery.slice(1).map((src) => (
                <div
                  key={src}
                  className="relative aspect-[2/3] overflow-hidden bg-stone"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 45vw, 25vw"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          {product.badge ? (
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
              {product.badge}
            </p>
          ) : null}
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-ink-soft">{product.tagline}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <p className="text-2xl font-semibold text-ink">
              {formatPrice(product.price)}
            </p>
            {product.compareAt ? (
              <p className="text-base text-ink/35 line-through">
                {formatPrice(product.compareAt)}
              </p>
            ) : null}
            <StockStatus product={product} />
          </div>
          <p className="mt-6 text-base leading-relaxed text-ink-soft">
            {product.description}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink/55">
            Photos show the same product style you&apos;ll receive. Color may
            vary from what&apos;s pictured depending on available stock.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <AddToCartButton productId={product.id} />
            <Link href="/cart" className="btn-dark-ghost">
              View cart
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink/50">
            {product.stock > 0
              ? product.shippingNote
              : "Currently 0 in stock. Samples are being ordered, so check back soon."}
          </p>

          <div className="mt-10 border-t border-line pt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Benefits
            </h2>
            <ul className="mt-4 space-y-2 text-ink-soft">
              {product.benefits.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">
              What&apos;s included
            </h2>
            <ul className="mt-4 space-y-2 text-ink-soft">
              {product.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {pairingNudge ? (
            <div className="mt-10 border border-line bg-surface p-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
                Pair it
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {pairingNudge.name}
              </p>
              <p className="mt-2 text-sm text-ink-soft">{pairingNudge.tagline}</p>
              <Link
                href={`/products/${pairingNudge.slug}`}
                className="mt-4 inline-block text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink/70 transition hover:text-ink"
              >
                Add the lick mat · {formatPrice(pairingNudge.price)} →
              </Link>
            </div>
          ) : null}

          <div className="mt-10 border-t border-line pt-8">
            <h2 className="font-display text-2xl font-semibold text-ink">FAQ</h2>
            <div className="mt-4 space-y-4 text-sm text-ink-soft">
              <div>
                <p className="font-semibold text-ink">How long does shipping take?</p>
                <p className="mt-1">
                  Most U.S. orders arrive in about 5 to 8 business days. We ship
                  within 24 hours of ordering when stock is available.
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">What is your return policy?</p>
                <p className="mt-1">
                  30-day returns on unused or defective items. See{" "}
                  <Link
                    href="/shipping"
                    className="font-medium text-moss underline-offset-2 hover:underline"
                  >
                    Shipping &amp; returns
                  </Link>{" "}
                  for details, or{" "}
                  <Link
                    href="/returns"
                    className="font-medium text-moss underline-offset-2 hover:underline"
                  >
                    start a return request
                  </Link>
                  .
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">
                  Will my item match the photo exactly?
                </p>
                <p className="mt-1">
                  Yes in style and function. It&apos;s the same product. Color
                  may differ from the photos based on available stock.
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">
                  Does this treat medical anxiety?
                </p>
                <p className="mt-1">
                  No. NestPaw products are comfort and enrichment tools for home
                  life, not veterinary treatments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24">
          <h2 className="font-display text-3xl font-semibold text-ink">
            You may also like
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

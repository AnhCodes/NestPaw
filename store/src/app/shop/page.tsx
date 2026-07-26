import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import {
  categories,
  getProductsByCategory,
  type Category,
} from "@/lib/products";

type SearchParams = Promise<{ category?: string }>;

export const metadata = {
  title: "Shop",
  description:
    "Shop NestPaw Core 4 — calm enrichment and groom essentials for dogs at home.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = params.category ?? "all";
  const category = (
    categories.some((c) => c.id === raw) ? raw : "all"
  ) as Category | "all";
  const list = getProductsByCategory(category);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <div className="flex flex-col gap-8 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
            Shop
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-ink md:text-6xl">
            The collection
          </h1>
          <p className="mt-4 text-base text-ink-soft md:text-lg">
            Calm enrichment and groom tools that keep home life easier — free
            shipping over $40.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {categories.map((c) => {
            const href = c.id === "all" ? "/shop" : `/shop?category=${c.id}`;
            const active = category === c.id;
            return (
              <Link
                key={c.id}
                href={href}
                className={`border-b-2 pb-1 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition ${
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

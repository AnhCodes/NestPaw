import { ProductCard } from "@/components/product-card";
import { getProductsWithStock } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Shop",
  description:
    "Shop NestPaw calm enrichment and grooming essentials for dogs at home. Free shipping over $40.",
  path: "/shop",
});

export default async function ShopPage() {
  const products = await getProductsWithStock();

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-16">
      <div className="max-w-2xl border-b border-line pb-10">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-leaf">
          Shop
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-ink md:text-6xl">
          The collection
        </h1>
        <p className="mt-4 text-base text-ink-soft md:text-lg">
          Calm enrichment and groom tools that keep home life easier, with free
          shipping over&nbsp;$40.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-3 lg:gap-x-4 lg:gap-y-10">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

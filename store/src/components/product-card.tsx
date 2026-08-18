import Image from "next/image";
import Link from "next/link";
import { StockStatus } from "@/components/stock-status";
import { formatPrice, isInStock, type Product } from "@/lib/products";

/** Studio shots sit low or have empty sky; crop toward the product. */
const imagePosition: Record<string, string> = {
  "forage-snuffle-mat": "object-[center_78%]",
  "quiet-nail-grinder": "object-[center_42%]",
};

export function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const objectPos = imagePosition[product.slug] ?? "object-center";

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group block ${className}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-canvas md:rounded-3xl">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition duration-700 ease-out group-hover:scale-[1.03] ${objectPos}`}
        />
        <div className="pointer-events-none absolute right-2 top-2 z-10 md:right-3 md:top-3">
          <StockStatus product={product} tone="badge" />
        </div>
        {!isInStock(product) ? (
          <div className="pointer-events-none absolute inset-0 bg-canvas/25" />
        ) : null}
      </div>
      <div className="px-0.5 pt-3 md:pt-4">
        {product.badge ? (
          <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-leaf">
            {product.badge}
          </p>
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[0.95rem] font-semibold leading-snug text-ink md:text-xl">
            {product.name}
          </h3>
          <p className="shrink-0 pt-0.5 text-sm font-semibold text-ink">
            {formatPrice(product.price)}
          </p>
        </div>
        <p className="mt-1 hidden text-sm text-ink-soft line-clamp-2 sm:block">
          {product.tagline}
        </p>
      </div>
    </Link>
  );
}

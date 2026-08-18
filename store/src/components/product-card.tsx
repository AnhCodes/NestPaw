import Image from "next/image";
import Link from "next/link";
import { StockStatus } from "@/components/stock-status";
import { formatPrice, isInStock, type Product } from "@/lib/products";

export function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group block ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-matte">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-5 transition duration-700 ease-out group-hover:scale-[1.03] md:p-7"
        />
        <div className="pointer-events-none absolute right-3 top-3 z-10 md:right-4 md:top-4">
          <StockStatus product={product} tone="badge" />
        </div>
        {!isInStock(product) ? (
          <div className="pointer-events-none absolute inset-0 bg-matte/20" />
        ) : null}
      </div>
      <div className="px-0.5 pt-4">
        {product.badge ? (
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-leaf">
            {product.badge}
          </p>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold leading-snug text-ink md:text-2xl">
            {product.name}
          </h3>
          <p className="shrink-0 pt-1 text-sm font-semibold text-ink">
            {formatPrice(product.price)}
          </p>
        </div>
        <p className="mt-1 text-sm text-ink-soft line-clamp-2">
          {product.tagline}
        </p>
      </div>
    </Link>
  );
}

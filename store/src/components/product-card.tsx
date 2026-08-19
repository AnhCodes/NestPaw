import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { formatPrice, isInStock, type Product } from "@/lib/products";

export function ProductCard({
  product,
  large = false,
  fill = false,
  className = "",
}: {
  product: Product;
  large?: boolean;
  /** Stretch to parent height instead of fixed aspect ratio */
  fill?: boolean;
  className?: string;
}) {
  const mediaClass = fill
    ? "h-full min-h-[16rem]"
    : large
      ? "h-full min-h-[22rem]"
      : "aspect-[2/3]";

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group relative block overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_0_rgba(14,22,19,0.04)] ${
        fill || large ? "h-full" : ""
      } ${className}`}
    >
      <div className={`relative w-full overflow-hidden bg-[#d8e0da] ${mediaClass}`}>
        <ProductImage
          src={product.image}
          alt={product.name}
          sizes={
            large || fill
              ? "(max-width: 768px) 100vw, 50vw"
              : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          }
          className="md:transition md:duration-700 md:ease-out md:group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

        {!isInStock(product) ? (
          <div className="pointer-events-none absolute inset-0 bg-black/10" />
        ) : null}

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 md:p-6 ${
            large ? "md:p-8" : ""
          }`}
        >
          {product.badge ? (
            <span className="mb-3 inline-block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/80">
              {product.badge}
            </span>
          ) : null}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3
                className={`font-display font-semibold text-white drop-shadow-sm ${
                  large ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                }`}
              >
                {product.name}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-white/80 line-clamp-2">
                {product.tagline}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-white">
                {formatPrice(product.price)}
              </p>
              <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/0 transition group-hover:text-white/90">
                View →
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
